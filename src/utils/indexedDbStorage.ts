/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CurriculumModuleDefinition,
  CurriculumStructure,
  LearnerState,
  Lesson,
  NotebookInvestigation,
} from '../types/domain';

const DB_NAME = 'AlexSecurityAcademyDB';
const DB_VERSION = 1;

export const STORES = {
  CURRICULUM_STRUCTURE: 'curriculum_structure',
  MODULES: 'modules',
  LESSONS: 'lessons',
  LEARNER_STATE: 'learner_state',
  NOTEBOOK: 'notebook_investigations',
  STORAGE_META: 'storage_meta',
} as const;

class IndexedDbManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  public getDatabase(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('IndexedDB is not supported in this runtime environment'));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORES.CURRICULUM_STRUCTURE)) {
          db.createObjectStore(STORES.CURRICULUM_STRUCTURE, { keyPath: 'version' });
        }
        if (!db.objectStoreNames.contains(STORES.MODULES)) {
          const modStore = db.createObjectStore(STORES.MODULES, { keyPath: 'id' });
          modStore.createIndex('number', 'number', { unique: true });
          modStore.createIndex('track', 'track', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.LESSONS)) {
          const lesStore = db.createObjectStore(STORES.LESSONS, { keyPath: 'id' });
          lesStore.createIndex('moduleId', 'moduleId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.LEARNER_STATE)) {
          db.createObjectStore(STORES.LEARNER_STATE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORES.NOTEBOOK)) {
          const nbStore = db.createObjectStore(STORES.NOTEBOOK, { keyPath: 'id' });
          nbStore.createIndex('verdict', 'verdict', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.STORAGE_META)) {
          db.createObjectStore(STORES.STORAGE_META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error || new Error('Failed to open AlexSecurityAcademyDB'));
      };
    });

    return this.dbPromise;
  }

  /**
   * Persists the complete 26-module curriculum structure and individual module/lesson records
   */
  public async persistCurriculumStructure(
    structure: CurriculumStructure,
    lessons: Lesson[] = []
  ): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [STORES.CURRICULUM_STRUCTURE, STORES.MODULES, STORES.LESSONS, STORES.STORAGE_META],
        'readwrite'
      );

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      // 1. Store high-level curriculum structure record
      const structStore = transaction.objectStore(STORES.CURRICULUM_STRUCTURE);
      structStore.put(structure);

      // 2. Store individual module definitions
      const modStore = transaction.objectStore(STORES.MODULES);
      for (const mod of structure.modules) {
        modStore.put(mod);
      }

      // 3. Store individual lesson records
      if (lessons.length > 0) {
        const lesStore = transaction.objectStore(STORES.LESSONS);
        for (const les of lessons) {
          lesStore.put(les);
        }
      }

      // 4. Update metadata
      const metaStore = transaction.objectStore(STORES.STORAGE_META);
      metaStore.put({
        key: 'curriculum_last_synced',
        timestamp: new Date().toISOString(),
        version: structure.version,
        moduleCount: structure.modules.length,
      });
    });
  }

  /**
   * Retrieves the full curriculum structure from IndexedDB
   */
  public async fetchCurriculumStructure(version?: string): Promise<CurriculumStructure | null> {
    try {
      const db = await this.getDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.CURRICULUM_STRUCTURE, 'readonly');
        const store = tx.objectStore(STORES.CURRICULUM_STRUCTURE);

        if (version) {
          const req = store.get(version);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        } else {
          // Fetch most recent or first entry
          const req = store.openCursor(null, 'prev');
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
              resolve(cursor.value as CurriculumStructure);
            } else {
              resolve(null);
            }
          };
          req.onerror = () => reject(req.error);
        }
      });
    } catch {
      return null;
    }
  }

  /**
   * Retrieves all modules from the modules store in order
   */
  public async fetchAllModules(): Promise<CurriculumModuleDefinition[]> {
    try {
      const db = await this.getDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.MODULES, 'readonly');
        const store = tx.objectStore(STORES.MODULES);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = (req.result as CurriculumModuleDefinition[]) || [];
          results.sort((a, b) => a.number - b.number);
          resolve(results);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Persists learner state into IndexedDB with key 'active_learner'
   */
  public async persistLearnerState(state: LearnerState): Promise<void> {
    try {
      const db = await this.getDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.LEARNER_STATE, STORES.STORAGE_META], 'readwrite');
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();

        const stateStore = tx.objectStore(STORES.LEARNER_STATE);
        stateStore.put({ key: 'active_learner', value: state, savedAt: new Date().toISOString() });

        const metaStore = tx.objectStore(STORES.STORAGE_META);
        metaStore.put({ key: 'learner_state_last_saved', timestamp: new Date().toISOString() });
      });
    } catch {
      // Fallback handled by caller
    }
  }

  /**
   * Retrieves active learner state from IndexedDB
   */
  public async fetchLearnerState(): Promise<LearnerState | null> {
    try {
      const db = await this.getDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.LEARNER_STATE, 'readonly');
        const store = tx.objectStore(STORES.LEARNER_STATE);
        const req = store.get('active_learner');
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            resolve(req.result.value as LearnerState);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Persists an individual hypothesis record to IndexedDB
   */
  public async persistHypothesis(inv: NotebookInvestigation): Promise<void> {
    try {
      const db = await this.getDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.NOTEBOOK, 'readwrite');
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();
        tx.objectStore(STORES.NOTEBOOK).put(inv);
      });
    } catch {
      // ignore in offline/unsupported
    }
  }

  /**
   * Retrieves all hypothesis records from IndexedDB
   */
  public async fetchAllHypotheses(): Promise<NotebookInvestigation[]> {
    try {
      const db = await this.getDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.NOTEBOOK, 'readonly');
        const req = tx.objectStore(STORES.NOTEBOOK).getAll();
        req.onsuccess = () => resolve((req.result as NotebookInvestigation[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Retrieves storage diagnostic metrics
   */
  public async getDiagnostics(): Promise<{
    isSupported: boolean;
    isAvailable: boolean;
    curriculumVersion: string | null;
    moduleCount: number;
    lessonCount: number;
    hasSavedState: boolean;
    lastSavedTimestamp: string | null;
  }> {
    if (!this.isSupported()) {
      return {
        isSupported: false,
        isAvailable: false,
        curriculumVersion: null,
        moduleCount: 0,
        lessonCount: 0,
        hasSavedState: false,
        lastSavedTimestamp: null,
      };
    }

    try {
      const db = await this.getDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(
          [STORES.MODULES, STORES.LESSONS, STORES.CURRICULUM_STRUCTURE, STORES.STORAGE_META],
          'readonly'
        );

        let moduleCount = 0;
        let lessonCount = 0;
        let curriculumVersion: string | null = null;
        let lastSaved: string | null = null;

        const modReq = tx.objectStore(STORES.MODULES).count();
        modReq.onsuccess = () => {
          moduleCount = modReq.result;
        };

        const lesReq = tx.objectStore(STORES.LESSONS).count();
        lesReq.onsuccess = () => {
          lessonCount = lesReq.result;
        };

        const curReq = tx.objectStore(STORES.CURRICULUM_STRUCTURE).openCursor(null, 'prev');
        curReq.onsuccess = () => {
          if (curReq.result) {
            curriculumVersion = (curReq.result.value as CurriculumStructure).version;
          }
        };

        const metaReq = tx.objectStore(STORES.STORAGE_META).get('learner_state_last_saved');
        metaReq.onsuccess = () => {
          if (metaReq.result) {
            lastSaved = metaReq.result.timestamp;
          }
        };

        tx.oncomplete = () => {
          resolve({
            isSupported: true,
            isAvailable: true,
            curriculumVersion,
            moduleCount,
            lessonCount,
            hasSavedState: lastSaved !== null,
            lastSavedTimestamp: lastSaved,
          });
        };

        tx.onerror = () => {
          resolve({
            isSupported: true,
            isAvailable: false,
            curriculumVersion: null,
            moduleCount: 0,
            lessonCount: 0,
            hasSavedState: false,
            lastSavedTimestamp: null,
          });
        };
      });
    } catch {
      return {
        isSupported: true,
        isAvailable: false,
        curriculumVersion: null,
        moduleCount: 0,
        lessonCount: 0,
        hasSavedState: false,
        lastSavedTimestamp: null,
      };
    }
  }
}

export const indexedDbStorage = new IndexedDbManager();
