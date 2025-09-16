

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface SeatingPosition {
  x: number;
  y: number;
}

export interface ConductEntry {
    id: string;
    date: string; // ISO String
    comment: string;
    type: 'positive' | 'negative' | 'neutral';
    category: string;
    points: number;
}

export interface Student {
  id: number;
  name: string;
  grades: { [assignmentId: string]: number };
  attendance: { [date: string]: AttendanceStatus };
  conductLog: ConductEntry[];
  seatingPosition?: SeatingPosition;
}

export interface Block {
  id: string;
  name: string;
}

export interface Assignment {
  id: string;
  name: string;
  weight: number; // e.g., 10 for 10%
  blockId: string;
}

export interface GradeThresholds {
  needsImprovement: number; // e.g., 6 (grades < 6 are red)
  satisfactory: number;     // e.g., 8 (grades < 8 are yellow)
}

export interface AtRiskThresholds {
  lowGrade: number;
  highAbsences: number;
  negConduct: number;
}

export interface LessonPlan {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    objective: string;
    materials: string;
    activities: string;
}

export type BadgeId = 'top' | 'attendance' | 'citizen' | 'progress';

export interface Badge {
    id: BadgeId;
    label: string;
    icon: JSX.Element;
    color: string;
}

export interface ClassData {
  id: number;
  name: string;
  semester: string;
  professor: string;
  students: Student[];
  assignments: Assignment[];
  blocks: Block[];
  gradeThresholds: GradeThresholds;
  atRiskThresholds: AtRiskThresholds;
  lessonPlans: LessonPlan[];
  seatingChart: {
      rows: number;
      cols: number;
  }
}

export enum View {
  DASHBOARD,
  GRADEBOOK,
  AITOOLS,
  LESSON_PLANNER,
  SEATING_CHART,
  AITOOLS_CLASS,
  CLASS_CONDUCT_OVERVIEW,
  AIParentComms,
  AIStudentSummary,
  GENERATE_REPORT,
  EVALUATION_TOOL_GENERATOR,
  IMPORT_STUDENTS,
}