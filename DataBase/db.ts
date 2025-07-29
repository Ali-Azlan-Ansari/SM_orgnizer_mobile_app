import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';

SQLite.enablePromise(true);

export const getDBConnection = async (): Promise<SQLiteDatabase> => {
 const db= SQLite.openDatabase({ name: 'mydb.db', location: 'default' });
 return db
};



export const createSubjectTable = async (db: SQLiteDatabase): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS subject (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher_name TEXT,
      abbreviation TEXT,
      semester TEXT,
      active_subject INTEGER,
      date TEXT
    );
  `;
  await db.executeSql(query);
};

export const createImageTable = async (db: SQLiteDatabase): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      image_uri TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
    );
  `;
  await db.executeSql(query);
};

export const setupDatabaseTables = async (): Promise<void> => {
  const db = await getDBConnection();
  await createSubjectTable(db);
  await createImageTable(db);
};

export const addSubject = async (
  db: SQLiteDatabase,
  subject: {
    name: string;
    teacher_name?: string;
    abbreviation?: string;
    semester?: string;
    active_subject?: number;
    date?: string;
  }
): Promise<void> => {
  const query = `
    INSERT INTO subject (name, teacher_name, abbreviation, semester, active_subject, date)
    VALUES (?, ?, ?, ?, ?, ?);
  `;

  const values = [
    subject.name,
    subject.teacher_name ?? null,
    subject.abbreviation ?? null,
    subject.semester ?? null,
    subject.active_subject ?? 0,
    subject.date ?? new Date().toISOString()
  ];

  await db.executeSql(query, values);
};


export const getAllSubjects = async (db: SQLiteDatabase): Promise<any[]> => {
  const query = `SELECT * FROM subject ORDER BY id DESC;`;
  const results = await db.executeSql(query);
  const subjects: any[] = [];

  for (let i = 0; i < results[0].rows.length; i++) {
    subjects.push(results[0].rows.item(i));
  }

  return subjects;
};

export const deleteSubjectById = async (db: SQLiteDatabase, subjectId: number): Promise<void> => {
  const query = `DELETE FROM subject WHERE id = ?;`;
  await db.executeSql(query, [subjectId]);
};

export const getSubjectById = async (db: SQLiteDatabase, subjectId: number): Promise<Subject | null> => {
  const query = `SELECT * FROM subject WHERE id = ?;`;
  const results = await db.executeSql(query, [subjectId]);

  if (results[0].rows.length > 0) {
    return results[0].rows.item(0) as Subject;
  }

  return null;
};

export const updateSubject = async (
  db: SQLiteDatabase,
  id: number,
  updatedData: {
    name: string;
    teacher_name?: string;
    abbreviation?: string;
    semester?: string;
    active_subject?: number;
    date?: string;
  }
): Promise<void> => {
  const query = `
    UPDATE subject
    SET name = ?, teacher_name = ?, abbreviation = ?, semester = ?, active_subject = ?, date = ?
    WHERE id = ?;
  `;
  const values = [
    updatedData.name,
    updatedData.teacher_name ?? null,
    updatedData.abbreviation ?? null,
    updatedData.semester ?? null,
    updatedData.active_subject ?? 1,
    updatedData.date ?? new Date().toISOString(),
    id
  ];
  await db.executeSql(query, values);
};

export const getActiveSubjects = async (db: SQLiteDatabase): Promise<any[]> => {
  const query = `SELECT * FROM subject WHERE active_subject = 1 ORDER BY id DESC;`;
  const results = await db.executeSql(query);
  const subjects: any[] = [];

  for (let i = 0; i < results[0].rows.length; i++) {
    subjects.push(results[0].rows.item(i));
  }

  return subjects;
};

export const addImages = async (
  db: SQLiteDatabase,
  subjectId: number,
  imageUris: string[]
): Promise<void> => {
  debugger
  const query = `
    INSERT INTO image (subject_id, image_uri)
    VALUES (?, ?);
  `;

  const insertPromises = imageUris.map(uri =>
    db.executeSql(query, [subjectId, uri])
  );

  await Promise.all(insertPromises); // Run all inserts in parallel
};

export const getImageById = async (
  db: SQLiteDatabase,
  imageId: number
): Promise<any | null> => {
  const query = `SELECT * FROM image WHERE id = ?;`;
  const result = await db.executeSql(query, [imageId]);

  if (result[0].rows.length > 0) {
    return result[0].rows.item(0);
  }

  return null;
};

export const getImagesBySubjectId = async (
  db: SQLiteDatabase,
  subjectId: number
): Promise<any[]> => {
  const query = `SELECT * FROM image WHERE subject_id = ? ORDER BY id DESC;`;
  const result = await db.executeSql(query, [subjectId]);

  const images: any[] = [];
  for (let i = 0; i < result[0].rows.length; i++) {
    images.push(result[0].rows.item(i));
  }

  return images;
};

export const deleteImagesByUri = async (db: SQLiteDatabase, uris: string[]) => {
  const placeholders = uris.map(() => '?').join(',');
  await db.executeSql(`DELETE FROM image WHERE image_uri IN (${placeholders})`, uris);
};

export type Subject = {
  id?: number;
  name: string;
  teacher_name?: string;
  abbreviation?: string;
  semester?: string;
  active_subject?: number;
  date?: string;
};