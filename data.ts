import type { ClassData } from './types';

export const initialClasses: ClassData[] = [
  {
    id: 1,
    name: 'Conciencia Histórica 1 - A',
    semester: '3er Semestre',
    professor: 'Prof. Victor Barrientos Arce',
    gradeThresholds: {
      needsImprovement: 6,
      satisfactory: 8,
    },
    atRiskThresholds: {
      lowGrade: 6.0,
      highAbsences: 3,
      negConduct: -5,
    },
    blocks: [
        { id: 'b1', name: 'BLOQUE 1' },
        { id: 'b2', name: 'BLOQUE 2' },
        { id: 'b3', name: 'BLOQUE 3' },
    ],
    assignments: [
        { id: 'a1', name: 'Desarrollo de Actividad', weight: 10, blockId: 'b1' },
        { id: 'a2', name: 'Cuaderno', weight: 10, blockId: 'b1' },
        { id: 'a3', name: 'Actividades en Clase', weight: 15, blockId: 'b1' },
        { id: 'a4', name: 'Proyecto Integrador', weight: 25, blockId: 'b2' },
        { id: 'a5', name: 'Examen Parcial', weight: 15, blockId: 'b2' },
        { id: 'a6', name: 'Exposición', weight: 10, blockId: 'b3' },
        { id: 'a7', name: 'Ensayo Final', weight: 15, blockId: 'b3' },
    ],
    students: [
      { id: 1, name: 'Álvarez, Sofía', grades: { a1: 9.0, a2: 10.0, a3: 8.0, a4: 8.9, a5: 9.5, a6: 10.0, a7: 9.4 }, attendance: { '2025-09-03': 'present', '2025-09-04': 'present', '2025-09-05': 'present' }, conductLog: [], seatingPosition: { x: 0, y: 0 } },
      { id: 2, name: 'Benítez, Carlos', grades: { a1: 10.0, a2: 9.0, a3: 9.0, a4: 8.3, a5: 10.0, a6: 10.0, a7: 9.6 }, attendance: { '2025-09-03': 'present', '2025-09-04': 'present', '2025-09-05': 'present' }, conductLog: [{id: 'c-carlos-1', date: '2025-09-04', comment: 'Llegó 10 minutos tarde.', type: 'negative', category: 'Tardiness', points: -1}], seatingPosition: { x: 1, y: 0 } },
      { id: 3, name: 'Castillo, Daniela', grades: { a1: 5.0, a2: 6.0, a3: 5.5, a4: 6.9, a5: 4.5, a6: 5.0, a7: 5.4 }, attendance: { '2025-09-03': 'absent', '2025-09-04': 'absent', '2025-09-05': 'absent' }, conductLog: [ {id: 'c1', date: '2025-09-05', comment: 'No entregó la tarea a tiempo.', type: 'negative', category: 'Incomplete Work', points: -2}, {id: 'c2', date: '2025-09-04', comment: 'Interrumpió la clase.', type: 'negative', category: 'Disruptive Behavior', points: -3} ], seatingPosition: { x: 2, y: 0 } },
      { id: 4, name: 'Díaz, Eduardo', grades: { a1: 9.5, a2: 10.0, a3: 9.7, a4: 10.0, a5: 10.0, a6: 9.5, a7: 9.7 }, attendance: { '2025-09-03': 'present', '2025-09-04': 'present', '2025-09-05': 'present' }, conductLog: [], seatingPosition: { x: 0, y: 1 } },
      { id: 5, name: 'Flores, Gabriela', grades: { a1: 8.0, a2: 7.0, a3: 9.0, a4: 8.1, a5: 8.0, a6: 9.0, a7: 8.4 }, attendance: { '2025-09-03': 'present', '2025-09-04': 'present', '2025-09-05': 'present' }, conductLog: [ {id: 'c-gabriela-4', date: '2025-09-10', comment: 'Lideró a su equipo en el proyecto.', type: 'positive', category: 'Leadership', points: 3}, {id: 'c3', date: '2025-09-05', comment: 'Participación excelente en clase.', type: 'positive', category: 'Excellent Participation', points: 2}, {id: 'c4', date: '2025-09-04', comment: 'Ayudó a un compañero.', type: 'positive', category: 'Helping Others', points: 2}, {id: 'c5', date: '2025-09-03', comment: 'Presentó un trabajo muy creativo.', type: 'positive', category: 'Showing Initiative', points: 2} ], },
    ],
    lessonPlans: [
        { id: 'lp1', date: '2025-09-03', title: 'Introducción a las Civilizaciones Antiguas', objective: 'Comprender las características clave de las primeras civilizaciones.', materials: 'Libro de texto, mapa, pizarra', activities: 'Clase magistral, discusión en grupo, actividad con mapa.'},
    ],
    seatingChart: { rows: 5, cols: 6 },
  },
  {
    id: 2,
    name: 'Matemáticas 2 - B',
    semester: '2do Semestre',
    professor: 'Laura Torres',
    gradeThresholds: {
      needsImprovement: 6,
      satisfactory: 8,
    },
     atRiskThresholds: {
      lowGrade: 6.0,
      highAbsences: 3,
      negConduct: -5,
    },
    blocks: [
        { id: 'm-b1', name: 'PARCIAL 1' },
        { id: 'm-b2', name: 'PARCIAL 2' },
    ],
    assignments: [
        { id: 'm1', name: 'Tarea 1', weight: 20, blockId: 'm-b1' },
        { id: 'm2', name: 'Examen 1', weight: 30, blockId: 'm-b1' },
        { id: 'm3', name: 'Proyecto Final', weight: 50, blockId: 'm-b2' },
    ],
    students: [
      { id: 6, name: 'Gómez, Pedro', grades: { m1: 9.0, m2: 8.5, m3: 9.5 }, attendance: {'2025-09-03': 'present'}, conductLog: [{id: 'c-pedro-1', date: '2025-09-06', comment: 'Siempre tiene sus materiales listos.', type: 'positive', category: 'Responsibility', points: 1}] },
      { id: 7, name: 'Hernández, Ana', grades: { m1: 9.5, m2: 9.0, m3: 9.2 }, attendance: {'2025-09-03': 'late'}, conductLog: [] },
    ],
    lessonPlans: [],
    seatingChart: { rows: 5, cols: 5 },
  },
  {
    id: 3,
    name: 'INGLÉS 1',
    semester: '1er Semestre',
    professor: 'Victor Barrientos',
    gradeThresholds: {
      needsImprovement: 6,
      satisfactory: 8,
    },
     atRiskThresholds: {
      lowGrade: 6.0,
      highAbsences: 3,
      negConduct: -5,
    },
    blocks: [
        { id: 'i-b1', name: 'SEMESTRE' },
    ],
    assignments: [
        { id: 'i1', name: 'Tarea 1', weight: 50, blockId: 'i-b1' },
        { id: 'i2', name: 'Examen Final', weight: 50, blockId: 'i-b1' },
    ],
    students: [
      { id: 8, name: 'López, María', grades: {}, attendance: {}, conductLog: [] },
    ],
    lessonPlans: [],
    seatingChart: { rows: 4, cols: 6 },
  },
];