import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType } from 'docx';
import FileSaver from 'file-saver';
import { initialClasses } from './data.ts';
import type { ClassData, Student, Assignment, AttendanceStatus, Block, GradeThresholds, SeatingPosition, LessonPlan, ConductEntry, Badge, AtRiskThresholds, BadgeId } from './types.ts';
import { View } from './types.ts';
import { invokeAIFunction } from './aiService.ts';


// Chart.js registration
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// --- i18n & TRANSLATIONS ---
const translations = {
    es: {
        // General
        'Maestro': 'Maestro', 'Dashboard': 'Panel', 'Loading...': 'Cargando...', 'Close': 'Cerrar', 'Cancel': 'Cancelar', 'Save': 'Guardar', 'Saving...': 'Guardando...', 'Delete': 'Eliminar', 'Confirm': 'Confirmar', 'Edit': 'Editar', 'Add': 'Añadir', 'Error': 'Error', 'Generate': 'Generar', 'Generating...': 'Generando...', 'Logout': 'Cerrar Sesión',
        // Auth
        'Login': 'Iniciar Sesión', 'Email Address': 'Correo Electrónico', 'Password': 'Contraseña', 'Forgot Password?': '¿Olvidaste tu contraseña?', "Don't have an account? Sign Up": '¿No tienes cuenta? Regístrate',
        // Header & Dashboard
        'Your Classes': 'Tus Clases', 'AI Toolkit': 'Herramientas IA', 'Welcome to Maestro!': '¡Bienvenido a Maestro!', "It looks like you don't have any classes yet. Create one to get started!": "Parece que aún no tienes clases. ¡Crea una para empezar!", 'Students': 'Estudiantes', 'Grade Distribution': 'Distribución de Calificaciones', 'Back to Dashboard': 'Volver al Panel', 'Export Data': 'Exportar Datos', 'Import Data': 'Importar Datos', 'Are you sure you want to import data? This will overwrite your current classes.': '¿Estás seguro de que quieres importar datos? Esto sobrescribirá tus clases actuales.', 'At Risk': 'En Riesgo',
        // Class View & Sidebar
        'Gradebook': 'Calificador', 'Lesson Planner': 'Planificador de Lecciones', 'Seating Chart': 'Mapa de Asientos', 'AI Tools': 'Herramientas IA', 'Conduct': 'Conducta',
        // Gradebook
        'Class Average': 'Promedio de Clase', 'Highest Average': 'Promedio Más Alto', 'Lowest Average': 'Promedio Más Bajo', 'Total Students': 'Total de Estudiantes', 'Assignment': 'Tarea', 'Student': 'Estudiante', 'Tools': 'Herramientas', 'Statistics': 'Estadísticas', 'Take Attendance': 'Pasar Asistencia', 'Manage Blocks': 'Gestionar Bloques', 'Settings': 'Configuración', 'Student Name': 'Nombre del Estudiante', 'Final Average': 'Promedio Final', 'BLOCK AVG': 'PROM. BLOQUE', 'No students in this class yet.': 'Aún no hay estudiantes en esta clase.', 'Add a Student': 'Añadir Estudiante', 'Search student...': 'Buscar estudiante...', 'At-risk due to: {reasons}': 'En riesgo por: {reasons}', 'Low grades': 'Calificaciones bajas', 'High absences': 'Faltas elevadas', 'Negative conduct points': 'Puntos de conducta negativos',
        // Student Actions
        'Report': 'Reporte', 'Conduct Log': 'Registro de Conducta', 'AI Student Summary': 'Resumen IA del Estudiante', 'Draft Parent Email': 'Redactar Correo a Padres',
        // Modals
        'Create New Class': 'Crear Nueva Clase', 'Class Name (e.g., History 1 - A)': 'Nombre de la Clase (ej. Historia 1 - A)', 'Semester': 'Semestre', "Professor's Name": 'Nombre del Profesor', 'Create Class': 'Crear Clase', 'Add New Student': 'Añadir Nuevo Estudiante', 'Full name of the student': 'Nombre completo del estudiante', 'Edit Student': 'Editar Estudiante', 'Save Changes': 'Guardar Cambios', 'Delete Student': 'Eliminar Estudiante', 'Are you sure you want to delete {studentName}? This action cannot be undone.': '¿Estás seguro de que quieres eliminar a {studentName}? Esta acción no se puede deshacer.', 'Create New Assignment': 'Crear Nueva Tarea', 'Assignment Name': 'Nombre de la Tarea', 'Weight (%)': 'Ponderación (%)', 'Edit Assignment': 'Editar Tarea', 'Delete Assignment': 'Eliminar Tarea', 'Are you sure you want to delete the assignment "{assignmentName}"? All associated grades will be removed.': '¿Estás seguro de que quieres eliminar la tarea "{assignmentName}"? Todas las calificaciones asociadas serán eliminadas.', 'AI Exam Generator': 'Generador de Exámenes con IA', 'Exam Topic:': 'Tema del Examen:', 'e.g., The Cold War, Cell Mitosis': 'ej. La Guerra Fría, Mitosis Celular', 'Generate Exam': 'Generar Examen', 'AI is analyzing class performance...': 'La IA está analizando el rendimiento de la clase...', 'Advanced Class Analysis': 'Análisis Avanzado de la Clase', 'AI Feedback for {studentName}': 'Feedback de IA para {studentName}', 'Generating a comment...': 'Generando un comentario...', 'AI Student Group Generator': 'Generador de Grupos con IA', 'Grouping Strategy:': 'Estrategia de Agrupación:', 'Desired Group Size': 'Tamaño de Grupo Deseado', 'Mixed-skill groups': 'Grupos de habilidades mixtas', 'Similar-skill groups': 'Grupos de habilidades similares', 'Generate Groups': 'Generar Grupos', 'Summary': 'Resumen', 'Unseated Students': 'Estudiantes sin Asignar', 'Clear All': 'Limpiar Todo', 'All students are seated.': 'Todos los estudiantes tienen asiento.', "TEACHER'S DESK": 'ESCRITORIO DEL PROFESOR', 'Lesson Plan for {date}': 'Plan de Clase para {date}', 'Edit Lesson Plan': 'Editar Plan de Clase', 'Lesson Title': 'Título de la Lección', 'Objective(s)': 'Objetivo(s)', 'Materials': 'Materiales', 'Activities & Procedures': 'Actividades y Procedimientos', 'AI Assistant': 'Asistente de IA', 'Suggest Activities': 'Sugerir Actividades',
        'Suggest Objectives': 'Sugerir Objetivos', 'AI is generating objectives...': 'La IA está generando objetivos...', 'Use These Objectives': 'Usar estos Objetivos',
        // AI Student Summary & Parent Comms
        'AI Summary for {studentName}': 'Resumen de IA para {studentName}', 'AI is generating a summary of the student\'s progress...': 'La IA está generando un resumen del progreso del estudiante...', 'Draft Email to Parent/Guardian': 'Redactar Correo para Padre/Tutor', 'Student:': 'Estudiante:', 'Purpose of Email:': 'Propósito del Correo:', 'Positive Update': 'Actualización Positiva', 'Concern about Grades': 'Preocupación por Calificaciones', 'Behavioral Issue': 'Asunto de Conducta', 'Draft Email': 'Redactar Correo',
        'Present': 'Presente', 'Late': 'Tarde', 'Absent': 'Ausente',
        'Set all to Present': 'Marcar Todos Presente',
        'New block name': 'Nombre del nuevo bloque', 'Confirm block deletion': '¿Estás seguro de que quieres eliminar este bloque? Todas las tareas y calificaciones asociadas se eliminarán permanentemente.', 'Grading Settings': 'Configuración de Calificaciones', 'Tardies': 'Tardanzas', 'Grade': 'Calificación', 'Grade Details': 'Detalles de Calificaciones', 'No conduct entries recorded.': 'No hay entradas de conducta registradas.',
        // Reporting & Badges
        'Generate Report': 'Generar Reporte', 'Report Type': 'Tipo de Reporte', 'Full Class Report': 'Reporte de Clase Completo', 'Individual Student Report': 'Reporte de Estudiante Individual', 'Select a student': 'Seleccionar un estudiante', 'Export to PDF': 'Exportar a PDF', 'Export to Word': 'Exportar a Word', 'Performance per Assignment': 'Rendimiento por Tarea', 'Report for': 'Reporte para', 'Report for {name}': 'Reporte para {name}', 'Class Report': 'Reporte de Clase', 'Class Overview': 'Resumen de la Clase', 'Achievements': 'Logros', 'Top Performer': 'Mejor Rendimiento', 'Perfect Attendance': 'Asistencia Perfecta', 'Great Progress': 'Gran Progreso', 'Good Citizen': 'Buen Ciudadano', 'Student Profile': 'Perfil del Estudiante',
        'Progress Over Time': 'Progreso a lo Largo del Tiempo', 'Average Grade': 'Calificación Promedio',
        // Statistics Modal
        'Average Attendance Rate': 'Tasa de Asistencia Promedio', 'Top Performing Assignment': 'Tarea con Mejor Rendimiento', 'Most Challenging Assignment': 'Tarea Más Desafiante',
        // NEM Tool
        'NEM Evaluation Tool Generator': 'Generador de Herramientas de Evaluación (NEM)', 'Instantly create rubrics and project outlines aligned with the Nueva Escuela Mexicana framework.': 'Crea rúbricas y esquemas de proyectos alineados con el marco de la Nueva Escuela Mexicana.', 'Topic or Subject': 'Tema o Asignatura', 'e.g., The Water Cycle, The Mexican Revolution': 'ej. El Ciclo del Agua, La Revolución Mexicana', 'Complexity Level': 'Nivel de Complejidad', 'Primary School': 'Primaria', 'Middle School': 'Secundaria', 'High School': 'Bachillerato', 'Output Type': 'Tipo de Herramienta', 'Rubric': 'Rúbrica', 'Community Project Outline': 'Esquema de Proyecto Comunitario', 'Generate Tool': 'Generar Herramienta',
        // Conduct
        'Class Conduct Overview': 'Resumen de Conducta de la Clase', 'This dashboard provides an overview of student conduct.': 'Este panel ofrece una visión general de la conducta de los estudiantes.', 'Positive Recognition': 'Reconocimiento Positivo', 'Students Requiring Attention': 'Estudiantes que Requieren Atención', 'No notable positive conduct yet.': 'Aún no hay conductas positivas destacables.', 'All students are meeting conduct expectations.': 'Todos los estudiantes están cumpliendo las expectativas de conducta.', 'Manage Conduct Log for {studentName}': 'Gestionar Registro de Conducta para {studentName}', 'Add New Entry': 'Añadir Nueva Entrada', 'Type': 'Tipo', 'Category': 'Categoría', 'Comment (optional)': 'Comentario (opcional)', 'Add Entry': 'Añadir Entrada', 'Points': 'Puntos',
        'Positive': 'Positivo', 'Negative': 'Negativo', 'Neutral': 'Neutral',
        'Excellent Participation': 'Participación Excelente', 'Helping Others': 'Ayuda a Compañeros', 'Leadership': 'Liderazgo', 'Muestra Iniciativa': 'Showing Initiative', 'Responsibility': 'Responsabilidad', 'Respect': 'Respeto', 'Teamwork': 'Trabajo en Equipo', 'Perseverance': 'Perseverancia', 'Creativity': 'Creatividad', 'Disruptive Behavior': 'Comportamiento Disruptivo', 'Lack of Materials': 'Falta de Material', 'Incomplete Work': 'Trabajo Incompleto', 'Disrespect': 'Falta de Respeto', 'Tardiness': 'Impuntualidad', 'Unprepared': 'No Preparado', 'Off-task Behavior': 'Comportamiento fuera de la tarea', 'Inappropriate Language': 'Lenguaje inapropiado', 'Observation': 'Observación', 'Parent Communication': 'Comunicación con padres', 'Other': 'Otro',
        'Academic Excellence': 'Excelencia Académica', 'Problem Solving': 'Resolución de Problemas', 'Positive Attitude': 'Actitud Positiva', 'Growth Mindset': 'Mentalidad de Crecimiento', 'Unauthorized Device Use': 'Uso no autorizado de dispositivos', 'Sleeping in class': 'Dormir en clase', 'Academic Dishonesty': 'Deshonestidad Académica', 'Bullying / Harassment': 'Acoso / Hostigamiento', 'Student Conference': 'Reunión con Estudiante', 'Guardian Contacted': 'Contacto con Tutor',
        // Import
        'Import Students': 'Importar Estudiantes', 'Add Single Student': 'Añadir un Estudiante', 'Paste a list of student names, one per line.': 'Pega una lista de nombres de estudiantes, uno por línea.', 'Preview': 'Vista Previa', '{count} new students will be added.': 'Se añadirán {count} nuevos estudiantes.', 'Importing...': 'Importando...',
        // New in overhaul
        'At-Risk Thresholds': 'Umbrales de Riesgo',
        'Low Grade Threshold': 'Umbral de Calificación Baja',
        'Absence Threshold': 'Umbral de Faltas',
        'Negative Conduct Threshold': 'Umbral de Conducta Negativa',
        'The grade below which a student is flagged.': 'La calificación por debajo de la cual se marca a un estudiante.',
        'Number of absences to flag a student.': 'Número de faltas para marcar a un estudiante.',
        'Negative points to flag a student (e.g., -5).': 'Puntos negativos para marcar a un estudiante (ej. -5).',
        'Select All': 'Seleccionar Todos',
        'Deselect All': 'Deselectar Todos',
        'Log Conduct for {count} students': 'Registrar Conducta para {count} estudiantes',
        'Generate Weekly Summary': 'Generar Resumen Semanal',
        'AI is analyzing conduct...': 'La IA está analizando la conducta...',
        'Conduct Summary': 'Resumen de Conducta',
        'Positive / Negative Ratio': 'Ratio Positivo / Negativo',
        // Seating chart AI
        'AI Auto-Seat': 'Asiento Automático IA',
        'Applying AI seating...': 'Aplicando asientos IA...',
        'Seating Strategy': 'Estrategia de Asientos',
        'Mix At-Risk & High-Achievers': 'Mezclar Riesgo y Alto Rendimiento',
        'Group by similar performance': 'Agrupar por rendimiento similar',
        'Randomize': 'Aleatorio',
        // Delete Class
        'Delete Class': 'Eliminar Clase',
        'Are you sure you want to delete the class {className}? This action cannot be undone.': '¿Estás seguro de que quieres eliminar la clase {className}? Esta acción no se puede deshacer.',
        // PDF Report
        'Student Report': 'Reporte del Estudiante', 'Print': 'Imprimir',
        // Role-based views
        'Administrator Panel': 'Panel de Administrador',
        'This is where administrators would manage teachers, school-wide settings, and billing.': 'Aquí es donde los administradores gestionarían a los profesores, la configuración de toda la escuela y la facturación.',
        'Manage Teachers': 'Gestionar Profesores',
        'School Settings': 'Configuración de la Escuela',
        'Billing & Subscription': 'Facturación y Suscripción',
        'Director General Panel': 'Panel de Dirección General',
        'This is where the general director would view school-wide analytics, reports, and overall performance metrics.': 'Aquí es donde el director general vería los análisis de toda la escuela, los informes y las métricas de rendimiento generales.',
        'School-wide Analytics': 'Análisis de toda la escuela',
        'Global Reports': 'Reportes Globales',
        'Performance Dashboards': 'Paneles de Rendimiento',
        'Feature coming soon.': 'Funcionalidad próximamente.',
        'Switch View': 'Cambiar Vista',
        'Teacher View': 'Vista de Profesor',
        'Admin View': 'Vista de Administrador',
        'Director View': 'Vista de Director',
        // Admin Panel
        'Add New Teacher': 'Añadir Nuevo Profesor',
        'Edit Teacher': 'Editar Profesor',
        'Delete Teacher': 'Eliminar Profesor',
        'Are you sure you want to delete this teacher?': '¿Estás seguro de que quieres eliminar a este profesor?',
        'Email': 'Correo Electrónico',
        'Role': 'Rol',
        'Actions': 'Acciones',
        'Teacher': 'Profesor',
        'Admin': 'Administrador',
        'Name': 'Nombre',
    },
    en: {
        'Maestro': 'Maestro', 'Dashboard': 'Dashboard', 'Loading...': 'Loading...', 'Close': 'Close', 'Cancel': 'Cancel', 'Save': 'Save', 'Saving...': 'Saving...', 'Delete': 'Delete', 'Confirm': 'Confirm', 'Edit': 'Edit', 'Add': 'Add', 'Error': 'Error', 'Generate': 'Generate', 'Generating...': 'Generating...', 'Logout': 'Logout',
        'Login': 'Login', 'Email Address': 'Email Address', 'Password': 'Password', 'Forgot Password?': 'Forgot Password?', "Don't have an account? Sign Up": "Don't have an account? Sign Up",
        'Your Classes': 'Your Classes', 'AI Toolkit': 'AI Toolkit', 'Welcome to Maestro!': 'Welcome to Maestro!', "It looks like you don't have any classes yet. Create one to get started!": "It looks like you don't have any classes yet. Create one to get started!", 'Students': 'Students', 'Grade Distribution': 'Grade Distribution', 'Back to Dashboard': 'Back to Dashboard', 'Export Data': 'Export Data', 'Import Data': 'Import Data', 'Are you sure you want to import data? This will overwrite your current classes.': 'Are you sure you want to import data? This will overwrite your current classes.', 'At Risk': 'At Risk', 'Gradebook': 'Gradebook', 'Lesson Planner': 'Lesson Planner', 'Seating Chart': 'Seating Chart', 'AI Tools': 'AI Tools', 'Conduct': 'Conduct', 'Class Average': 'Class Average', 'Highest Average': 'Highest Average', 'Lowest Average': 'Lowest Average', 'Total Students': 'Total Students', 'Assignment': 'Assignment', 'Student': 'Student', 'Tools': 'Tools', 'Statistics': 'Statistics', 'Take Attendance': 'Take Attendance', 'Manage Blocks': 'Manage Blocks', 'Settings': 'Settings', 'Student Name': 'Student Name', 'Final Average': 'Final Average', 'BLOCK AVG': 'BLOCK AVG', 'No students in this class yet.': 'No students in this class yet.', 'Add a Student': 'Add a Student', 'Search student...': 'Search student...', 'At-risk due to: {reasons}': 'At-risk due to: {reasons}', 'Low grades': 'Low grades', 'High absences': 'High absences', 'Negative conduct points': 'Negative conduct points', 'Report': 'Report', 'Conduct Log': 'Conduct Log', 'AI Student Summary': 'AI Student Summary', 'Draft Parent Email': 'Draft Parent Email', 'Create New Class': 'Create New Class', 'Class Name (e.g., History 1 - A)': 'Class Name (e.g., History 1 - A)', 'Semester': 'Semester', "Professor's Name": "Professor's Name", 'Create Class': 'Create Class', 'Add New Student': 'Add New Student', 'Full name of the student': 'Full name of the student', 'Edit Student': 'Edit Student', 'Save Changes': 'Save Changes', 'Delete Student': 'Delete Student', 'Are you sure you want to delete {studentName}? This action cannot be undone.': 'Are you sure you want to delete {studentName}? This action cannot be undone.', 'Create New Assignment': 'Create New Assignment', 'Assignment Name': 'Assignment Name', 'Weight (%)': 'Weight (%)', 'Edit Assignment': 'Edit Assignment', 'Delete Assignment': 'Delete Assignment', 'Are you sure you want to delete the assignment "{assignmentName}"? All associated grades will be removed.': 'Are you sure you want to delete the assignment "{assignmentName}"? All associated grades will be removed.', 'AI Exam Generator': 'AI Exam Generator', 'Exam Topic:': 'Exam Topic:', 'e.g., The Cold War, Cell Mitosis': 'e.g., The Cold War, Cell Mitosis', 'Generate Exam': 'Generate Exam', 'AI is analyzing class performance...': 'AI is analyzing class performance...', 'Advanced Class Analysis': 'Advanced Class Analysis', 'AI Feedback for {studentName}': 'AI Feedback for {studentName}', 'Generating a comment...': 'Generating a comment...', 'AI Student Group Generator': 'AI Student Group Generator', 'Grouping Strategy:': 'Grouping Strategy:', 'Desired Group Size': 'Desired Group Size', 'Mixed-skill groups': 'Mixed-skill groups', 'Similar-skill groups': 'Similar-skill groups', 'Generate Groups': 'Generate Groups', 'Summary': 'Summary', 'Unseated Students': 'Unseated Students', 'Clear All': 'Clear All', 'All students are seated.': 'All students are seated.', "TEACHER'S DESK": "TEACHER'S DESK", 'Lesson Plan for {date}': 'Lesson Plan for {date}', 'Edit Lesson Plan': 'Edit Lesson Plan', 'Lesson Title': 'Lesson Title', 'Objective(s)': 'Objective(s)', 'Materials': 'Materials', 'Activities & Procedures': 'Activities & Procedures', 'AI Assistant': 'AI Assistant', 'Suggest Activities': 'Suggest Activities',
        'Suggest Objectives': 'Suggest Objectives', 'AI is generating objectives...': 'AI is generating objectives...', 'Use These Objectives': 'Use These Objectives', 'AI Summary for {studentName}': 'AI Summary for {studentName}', 'AI is generating a summary of the student\'s progress...': 'AI is generating a summary of the student\'s progress...', 'Draft Email to Parent/Guardian': 'Draft Email to Parent/Guardian', 'Student:': 'Student:', 'Purpose of Email:': 'Purpose of Email:', 'Positive Update': 'Positive Update', 'Concern about Grades': 'Concern about Grades', 'Behavioral Issue': 'Behavioral Issue', 'Draft Email': 'Draft Email',
        'Present': 'Present', 'Late': 'Late', 'Absent': 'Absent',
        'Set All to Present': 'Set All to Present',
        'New block name': 'New block name', 'Confirm block deletion': 'Are you sure you want to delete this block? All associated assignments and grades will be permanently removed.', 'Grading Settings': 'Grading Settings', 'Tardies': 'Tardies', 'Grade': 'Grade', 'Grade Details': 'Grade Details', 'No conduct entries recorded.': 'No conduct entries recorded.',
        'Generate Report': 'Generate Report', 'Report Type': 'Report Type', 'Full Class Report': 'Full Class Report', 'Individual Student Report': 'Individual Student Report', 'Select a student': 'Select a student', 'Export to PDF': 'Export to PDF', 'Export to Word': 'Export to Word', 'Performance per Assignment': 'Performance per Assignment', 'Report for': 'Report for', 'Report for {name}': 'Report for {name}', 'Class Report': 'Class Report', 'Class Overview': 'Class Overview', 'Achievements': 'Achievements', 'Top Performer': 'Top Performer', 'Perfect Attendance': 'Perfect Attendance', 'Great Progress': 'Great Progress', 'Good Citizen': 'Good Citizen', 'Student Profile': 'Student Profile',
        'Progress Over Time': 'Progress Over Time', 'Average Grade': 'Average Grade',
        // Statistics Modal
        'Average Attendance Rate': 'Average Attendance Rate', 'Top Performing Assignment': 'Top Performing Assignment', 'Most Challenging Assignment': 'Most Challenging Assignment',
        'NEM Evaluation Tool Generator': 'NEM Evaluation Tool Generator', 'Instantly create rubrics and project outlines aligned with the Nueva Escuela Mexicana framework.': 'Instantly create rubrics and project outlines aligned with the Nueva Escuela Mexicana framework.', 'Topic or Subject': 'Topic or Subject', 'e.g., The Water Cycle, The Mexican Revolution': 'e.g., The Water Cycle, The Mexican Revolution', 'Complexity Level': 'Complexity Level', 'Primary School': 'Primary School', 'Middle School': 'Middle School', 'High School': 'High School', 'Output Type': 'Output Type', 'Rubric': 'Rubric', 'Community Project Outline': 'Community Project Outline', 'Generate Tool': 'Generate Tool',
        'Class Conduct Overview': 'Class Conduct Overview', 'This dashboard provides an overview of student conduct.': 'This dashboard provides an overview of student conduct.', 'Positive Recognition': 'Positive Recognition', 'Students Requiring Attention': 'Students Requiring Attention', 'No notable positive conduct yet.': 'No notable positive conduct yet.', 'All students are meeting conduct expectations.': 'All students are meeting conduct expectations.', 'Manage Conduct Log for {studentName}': 'Manage Conduct Log for {studentName}', 'Add New Entry': 'Add New Entry', 'Type': 'Type', 'Category': 'Category', 'Comment (optional)': 'Comment (optional)', 'Add Entry': 'Add Entry', 'Points': 'Points',
        'Positive': 'Positive', 'Negative': 'Negative', 'Neutral': 'Neutral',
        'Excellent Participation': 'Excellent Participation', 'Helping Others': 'Helping Others', 'Leadership': 'Leadership', 'Showing Initiative': 'Showing Initiative', 'Responsibility': 'Responsibility', 'Respect': 'Respect', 'Teamwork': 'Teamwork', 'Perseverance': 'Perseverance', 'Creativity': 'Creativity', 'Disruptive Behavior': 'Disruptive Behavior', 'Lack of Materials': 'Lack of Materials', 'Incomplete Work': 'Incomplete Work', 'Disrespect': 'Disrespect', 'Tardiness': 'Tardiness', 'Unprepared': 'Unprepared', 'Off-task Behavior': 'Off-task Behavior', 'Inappropriate Language': 'Inappropriate Language', 'Observation': 'Observation', 'Parent Communication': 'Parent Communication', 'Other': 'Other',
        'Academic Excellence': 'Academic Excellence', 'Problem Solving': 'Problem Solving', 'Positive Attitude': 'Positive Attitude', 'Growth Mindset': 'Growth Mindset', 'Unauthorized Device Use': 'Unauthorized Device Use', 'Sleeping in class': 'Sleeping in class', 'Academic Dishonesty': 'Academic Dishonesty', 'Bullying / Harassment': 'Bullying / Harassment', 'Student Conference': 'Student Conference', 'Guardian Contacted': 'Guardian Contacted',
        'Import Students': 'Import Students', 'Add Single Student': 'Add Single Student', 'Paste a list of student names, one per line.': 'Paste a list of student names, one per line.', 'Preview': 'Preview', '{count} new students will be added.': '{count} new students will be added.', 'Importing...': 'Importing...',
        // New in overhaul
        'At-Risk Thresholds': 'At-Risk Thresholds',
        'Low Grade Threshold': 'Low Grade Threshold',
        'Absence Threshold': 'Absence Threshold',
        'Negative Conduct Threshold': 'Negative Conduct Threshold',
        'The grade below which a student is flagged.': 'The grade below which a student is flagged.',
        'Number of absences to flag a student.': 'Number of absences to flag a student.',
        'Negative points to flag a student (e.g., -5).': 'Negative points to flag a student (e.g., -5).',
        'Select All': 'Select All',
        'Deselect All': 'Deselect All',
        'Log Conduct for {count} students': 'Log Conduct for {count} students',
        'Generate Weekly Summary': 'Generate Weekly Summary',
        'AI is analyzing conduct...': 'AI is analyzing conduct...',
        'Conduct Summary': 'Conduct Summary',
        'Positive / Negative Ratio': 'Positive / Negative Ratio',
        // Seating chart AI
        'AI Auto-Seat': 'AI Auto-Seat',
        'Applying AI seating...': 'Applying AI seating...',
        'Seating Strategy': 'Seating Strategy',
        'Mix At-Risk & High-Achievers': 'Mix At-Risk & High-Achievers',
        'Group by similar performance': 'Group by similar performance',
        'Randomize': 'Randomize',
        // Delete Class
        'Delete Class': 'Delete Class',
        'Are you sure you want to delete the class {className}? This action cannot be undone.': 'Are you sure you want to delete the class {className}? This action cannot be undone.',
        // PDF Report
        'Student Report': 'Student Report', 'Print': 'Print',
        // Role-based views
        'Administrator Panel': 'Administrator Panel',
        'This is where administrators would manage teachers, school-wide settings, and billing.': 'This is where administrators would manage teachers, school-wide settings, and billing.',
        'Manage Teachers': 'Manage Teachers',
        'School Settings': 'School Settings',
        'Billing & Subscription': 'Billing & Subscription',
        'Director General Panel': 'Director General Panel',
        'This is where the general director would view school-wide analytics, reports, and overall performance metrics.': 'This is where the general director would view school-wide analytics, reports, and overall performance metrics.',
        'School-wide Analytics': 'School-wide Analytics',
        'Global Reports': 'Global Reports',
        'Performance Dashboards': 'Performance Dashboards',
        'Feature coming soon.': 'Feature coming soon.',
        'Switch View': 'Switch View',
        'Teacher View': 'Teacher View',
        'Admin View': 'Admin View',
        'Director View': 'Director View',
        // Admin Panel
        'Add New Teacher': 'Add New Teacher',
        'Edit Teacher': 'Edit Teacher',
        'Delete Teacher': 'Delete Teacher',
        'Are you sure you want to delete this teacher?': 'Are you sure you want to delete this teacher?',
        'Email': 'Email',
        'Role': 'Role',
        'Actions': 'Actions',
        'Teacher': 'Teacher',
        'Admin': 'Admin',
        'Name': 'Name',
    }
};

const useTranslation = () => {
    const [language, setLanguage] = useState(() => localStorage.getItem('maestro-lang') || 'es');

    const setLang = useCallback((lang: 'es' | 'en') => {
        setLanguage(lang);
        localStorage.setItem('maestro-lang', lang);
    }, []);

    const t = useCallback((key: string, replacements: Record<string, string | number> = {}) => {
        let translation = translations[language as 'es' | 'en']?.[key as keyof typeof translations.es] || key;
        Object.keys(replacements).forEach(rKey => {
            translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
        });
        return translation;
    }, [language]);

    return { t, setLanguage: setLang, language };
};


// --- HELPER FUNCTIONS ---
const calculateAverage = (grades: { [key: string]: number }, assignments: Assignment[]): number => {
    if (!assignments || assignments.length === 0) return 0;
    
    // Filter for assignments that have grades
    const relevantAssignments = assignments.filter(ass => typeof grades[ass.id] === 'number');
    if (relevantAssignments.length === 0) return 0;

    const totalWeight = relevantAssignments.reduce((acc, ass) => acc + (ass.weight || 0), 0);

    if (totalWeight === 0) {
        const gradesArray = Object.values(grades).filter(g => typeof g === 'number');
        if (gradesArray.length === 0) return 0;
        return gradesArray.reduce((a, b) => a + b, 0) / gradesArray.length;
    };

    const weightedSum = relevantAssignments.reduce((acc, ass) => {
        const grade = grades[ass.id];
        return acc + (grade * (ass.weight || 0));
    }, 0);

    const avg = weightedSum / totalWeight;
    return isNaN(avg) ? 0 : parseFloat(avg.toFixed(1));
};

const formatDate = (date: Date, lang: string = 'en-US'): string => {
    return date.toISOString().split('T')[0];
}

const calculateAbsences = (student: Student): number => {
    return Object.values(student.attendance).filter(status => status === 'absent').length;
};

const getGradeColor = (grade: number | null | undefined, thresholds: GradeThresholds): string => {
    if (grade === null || typeof grade === 'undefined' || !thresholds) return 'text-muted';
    if (grade < thresholds.needsImprovement) return 'text-grade-fail';
    if (grade < thresholds.satisfactory) return 'text-grade-satisfactory';
    return 'text-grade-good';
};

const isStudentAtRisk = (student: Student, classData: ClassData | null): string[] => {
    if (!classData || !student) return [];
    const { atRiskThresholds, assignments } = classData;
    const reasons = [];
    const average = calculateAverage(student.grades, assignments);
    if (average > 0 && average < atRiskThresholds.lowGrade) {
        reasons.push('Low grades');
    }
    if (calculateAbsences(student) >= atRiskThresholds.highAbsences) {
        reasons.push('High absences');
    }
    const conductPoints = student.conductLog.reduce((sum, entry) => sum + (entry.points || 0), 0);
    if (conductPoints <= atRiskThresholds.negConduct) {
        reasons.push('Negative conduct points');
    }
    return reasons;
};

const getChartColors = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
        gridColor: styles.getPropertyValue('--color-border').trim() + '80',
        textColor: styles.getPropertyValue('--color-text-muted').trim(),
        titleColor: styles.getPropertyValue('--color-text-base').trim(),
        gradeGood: styles.getPropertyValue('--color-grade-good').trim(),
        gradeSatisfactory: styles.getPropertyValue('--color-grade-satisfactory').trim(),
        gradeFail: styles.getPropertyValue('--color-grade-fail').trim(),
        primary: styles.getPropertyValue('--color-primary').trim(),
    };
};

// FIX: Added a trailing comma inside <T,> to disambiguate the generic from a JSX tag in TSX files. This should fix a cascade of parsing errors.
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


// --- DATA MANAGEMENT HOOK (Simulating Backend) ---
const useClasses = () => {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial data load from localStorage (simulating a fetch)
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
            try {
                const storedClasses = localStorage.getItem('maestro-classes');
                if (storedClasses) {
                    setClasses(JSON.parse(storedClasses));
                } else {
                    setClasses(initialClasses);
                    localStorage.setItem('maestro-classes', JSON.stringify(initialClasses));
                }
            } catch (error) {
                console.error("Failed to load classes:", error);
                setClasses(initialClasses); // Fallback
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const saveData = useCallback(async (newClasses: ClassData[]) => {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate save delay
        setClasses(newClasses);
        localStorage.setItem('maestro-classes', JSON.stringify(newClasses));
    }, []);

    const createClass = useCallback(async (newClassData: Omit<ClassData, 'id' | 'students' | 'assignments' | 'blocks' | 'gradeThresholds' | 'atRiskThresholds' | 'lessonPlans' | 'seatingChart'>) => {
        const newClass: ClassData = {
            ...newClassData,
            id: Date.now(),
            students: [],
            assignments: [],
            blocks: [{ id: 'b1', name: 'BLOQUE 1' }],
            gradeThresholds: { needsImprovement: 6, satisfactory: 8 },
            atRiskThresholds: { lowGrade: 6, highAbsences: 3, negConduct: -5 },
            lessonPlans: [],
            seatingChart: { rows: 5, cols: 6 }
        };
        const updatedClasses = [...classes, newClass];
        await saveData(updatedClasses);
        return newClass;
    }, [classes, saveData]);

    const deleteClass = useCallback(async (classId: number) => {
        const updatedClasses = classes.filter(c => c.id !== classId);
        await saveData(updatedClasses);
    }, [classes, saveData]);


    const addStudent = useCallback(async (classId: number, studentName: string) => {
        const newStudent: Student = {
            id: Date.now(),
            name: studentName,
            grades: {},
            attendance: {},
            conductLog: [],
        };
        const updatedClasses = classes.map(c =>
            c.id === classId ? { ...c, students: [...c.students, newStudent].sort((a,b) => a.name.localeCompare(b.name)) } : c
        );
        await saveData(updatedClasses);
    }, [classes, saveData]);

    const updateStudent = useCallback(async (classId: number, studentId: number, newName: string) => {
        const updatedClasses = classes.map(c =>
            c.id === classId ? {
                ...c,
                students: c.students.map(s => s.id === studentId ? { ...s, name: newName } : s)
            } : c
        );
        await saveData(updatedClasses);
    }, [classes, saveData]);
    
    const deleteStudent = useCallback(async (classId: number, studentId: number) => {
        const updatedClasses = classes.map(c =>
            c.id === classId ? { ...c, students: c.students.filter(s => s.id !== studentId) } : c
        );
        await saveData(updatedClasses);
    }, [classes, saveData]);

    // FIX: Refactored to be type-safe. Assigning `undefined` to a grade is a type error. Instead, delete the property if the grade is null.
    const updateGrade = useCallback(async (classId: number, studentId: number, assignmentId: string, grade: number | null) => {
        const updatedClasses = classes.map(c => {
            if (c.id !== classId) return c;
            return {
                ...c,
                students: c.students.map(s => {
                    if (s.id !== studentId) return s;
                    const newGrades = { ...s.grades };
                    if (grade === null) {
                        delete newGrades[assignmentId];
                    } else {
                        newGrades[assignmentId] = grade;
                    }
                    return { ...s, grades: newGrades };
                })
            };
        });
        await saveData(updatedClasses);
    }, [classes, saveData]);

    const createAssignment = useCallback(async (classId: number, newAssignmentData: Omit<Assignment, 'id'>) => {
        const newAssignment: Assignment = {
            ...newAssignmentData,
            id: `a-${Date.now()}`
        };
        const updatedClasses = classes.map(c =>
            c.id === classId ? { ...c, assignments: [...c.assignments, newAssignment] } : c
        );
        await saveData(updatedClasses);
    }, [classes, saveData]);

    const updateAssignment = useCallback(async (classId: number, assignmentId: string, updatedData: Partial<Omit<Assignment, 'id'>>) => {
        const updatedClasses = classes.map(c =>
            c.id === classId ? {
                ...c,
                assignments: c.assignments.map(a =>
                    a.id === assignmentId ? { ...a, ...updatedData } : a
                )
            } : c
        );
        await saveData(updatedClasses);
    }, [classes, saveData]);

    const deleteAssignment = useCallback(async (classId: number, assignmentId: string) => {
        const updatedClasses = classes.map(c =>
            c.id === classId ? {
                ...c,
                assignments: c.assignments.filter(a => a.id !== assignmentId),
                students: c.students.map(s => {
                    const newGrades = { ...s.grades };
                    delete newGrades[assignmentId];
                    return { ...s, grades: newGrades };
                })
            } : c
        );
        await saveData(updatedClasses);
    }, [classes, saveData]);
    
    const updateClassSettings = useCallback(async (classId: number, settings: Partial<Pick<ClassData, 'gradeThresholds' | 'atRiskThresholds'>>) => {
        const updatedClasses = classes.map(c => c.id === classId ? { ...c, ...settings } : c);
        await saveData(updatedClasses);
    }, [classes, saveData]);

    const addConductEntry = useCallback(async (classId: number, studentId: number, entry: Omit<ConductEntry, 'id' | 'date'>) => {
        const newEntry: ConductEntry = {
            ...entry,
            id: `c-${Date.now()}`,
            date: new Date().toISOString(),
        }
        const updatedClasses = classes.map(c => c.id === classId ? {
            ...c,
            students: c.students.map(s => s.id === studentId ? { ...s, conductLog: [newEntry, ...s.conductLog] } : s)
        } : c);
        await saveData(updatedClasses);
    }, [classes, saveData]);

    const updateAttendance = useCallback(async (classId: number, studentId: number, date: string, status: AttendanceStatus) => {
        const updatedClasses = classes.map(c => c.id === classId ? {
            ...c,
            students: c.students.map(s => s.id === studentId ? {...s, attendance: {...s.attendance, [date]: status}} : s)
        } : c);
        await saveData(updatedClasses);
    }, [classes, saveData]);
    
    const importStudents = useCallback(async (classId: number, studentNames: string[]) => {
        const newStudents: Student[] = studentNames.map((name, index) => ({
             id: Date.now() + index,
            name,
            grades: {},
            attendance: {},
            conductLog: [],
        }));
        
        const updatedClasses = classes.map(c =>
            c.id === classId ? { ...c, students: [...c.students, ...newStudents].sort((a,b) => a.name.localeCompare(b.name)) } : c
        );
        await saveData(updatedClasses);
    }, [classes, saveData]);

    const updateSeatingChart = useCallback(async (classId: number, studentId: number, position: SeatingPosition | undefined) => {
         const updatedClasses = classes.map(c => c.id === classId ? {
            ...c,
            students: c.students.map(s => s.id === studentId ? {...s, seatingPosition: position } : s)
        } : c);
        await saveData(updatedClasses);
    }, [classes, saveData]);
    
    const clearAllSeats = useCallback(async (classId: number) => {
         const updatedClasses = classes.map(c => c.id === classId ? {
            ...c,
            students: c.students.map(s => ({...s, seatingPosition: undefined }))
        } : c);
        await saveData(updatedClasses);
    }, [classes, saveData]);
    
    const updateLessonPlan = useCallback(async (classId: number, plan: LessonPlan) => {
        const updatedClasses = classes.map(c => {
            if (c.id !== classId) return c;
            const existingPlanIndex = c.lessonPlans.findIndex(p => p.date === plan.date);
            let newPlans;
            if (existingPlanIndex > -1) {
                newPlans = [...c.lessonPlans];
                newPlans[existingPlanIndex] = plan;
            } else {
                newPlans = [...c.lessonPlans, plan];
            }
            return { ...c, lessonPlans: newPlans };
        });
        await saveData(updatedClasses);
    }, [classes, saveData]);

    const importData = useCallback(async (importedClasses: ClassData[]) => {
        await saveData(importedClasses);
    }, [saveData]);

    const addBlock = useCallback(async (classId: number, blockName: string) => {
        const newBlock: Block = { id: `b-${Date.now()}`, name: blockName };
         const updatedClasses = classes.map(c => c.id === classId ? { ...c, blocks: [...c.blocks, newBlock] } : c);
        await saveData(updatedClasses);
    }, [classes, saveData]);
    
    const deleteBlock = useCallback(async (classId: number, blockId: string) => {
        const updatedClasses = classes.map(c => {
            if (c.id !== classId) return c;
            const assignmentsInBlock = c.assignments.filter(a => a.blockId === blockId).map(a => a.id);
            return {
                ...c,
                blocks: c.blocks.filter(b => b.id !== blockId),
                assignments: c.assignments.filter(a => a.blockId !== blockId),
                students: c.students.map(s => {
                    const newGrades = {...s.grades};
                    assignmentsInBlock.forEach(aid => delete newGrades[aid]);
                    return {...s, grades: newGrades};
                })
            }
        });
        await saveData(updatedClasses);
    }, [classes, saveData]);

    return {
        classes,
        isLoading,
        createClass,
        deleteClass,
        addStudent,
        updateStudent,
        deleteStudent,
        updateGrade,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        updateClassSettings,
        addConductEntry,
        updateAttendance,
        importStudents,
        updateSeatingChart,
        clearAllSeats,
        updateLessonPlan,
        importData,
        addBlock,
        deleteBlock
    };
};

// --- GENERIC UI COMPONENTS ---

const Modal = ({ isOpen, onClose, children, title, size = 'md' }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string, size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-bg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className={`bg-secondary text-base rounded-lg shadow-2xl w-full ${sizeClasses[size]} flex flex-col animate-modal-content`}>
                <div className="flex items-center justify-between p-4 border-b border-base">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-muted hover:text-base transition-colors p-1 rounded-full">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: { children: React.ReactNode, onClick?: () => void, variant?: 'primary' | 'secondary' | 'danger' | 'ghost', className?: string, disabled?: boolean, type?: 'button' | 'submit' | 'reset' }) => {
    const baseClasses = 'px-4 py-2 rounded-md font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-secondary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses = {
        primary: 'bg-primary text-inverted hover:bg-primary-hover',
        secondary: 'bg-tertiary text-base hover:bg-border-base',
        danger: 'bg-grade-fail text-inverted hover:bg-red-600',
        ghost: 'bg-transparent text-primary hover:bg-primary-accent',
    };

    return (
        <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
};

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
    return (
        <input
            {...props}
            ref={ref}
            className={`w-full px-3 py-2 bg-tertiary border border-base rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${props.className}`}
        />
    );
});

const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => {
    return (
        <select {...props} className={`w-full px-3 py-2 bg-tertiary border border-base rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${props.className}`}>
            {children}
        </select>
    );
};

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    return (
        <textarea
            {...props}
            ref={ref}
            className={`w-full px-3 py-2 bg-tertiary border border-base rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${props.className}`}
        />
    );
});


const TooltipComponent = ({ text, children }: { text: string, children: React.ReactNode }) => {
    return (
        <div className="relative group flex items-center">
            {children}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-2 py-1 text-xs text-inverted bg-gray-800 dark:bg-slate-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {text}
            </div>
        </div>
    );
};

// --- ICONS ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const UserGroupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.273-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.273.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const ViewGridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ChatAlt2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" /><path d="M4 14a1 1 0 000 2h7a1 1 0 000-2H4z" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
{/* FIX: Updated icon component to accept className for custom styling */}
const ExclamationCircleIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const InformationCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const ArrowDownOnSquareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const ArrowUpOnSquareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const DocumentDuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;
const ClipboardDocumentCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.075c0 1.313-.964 2.446-2.25 2.612A48.527 48.527 0 0112 21.75c-2.676 0-5.216-.23-7.5-.663-1.286-.166-2.25-1.299-2.25-2.612v-4.075c0-1.313.964-2.446 2.25-2.612A48.527 48.527 0 0112 11.25c2.676 0 5.216.23 7.5.663 1.286.166 2.25 1.299 2.25 2.612z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11.25V21.75m0-10.5V6.75a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v2.25m-6.75-4.5v6.75a2.25 2.25 0 002.25 2.25h1.5a2.25 2.25 0 002.25-2.25V6.75m-6.75 4.5H7.5a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0112 6.75v4.5" /></svg>;
const AcademicCapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path d="M12 14.25c-2.43 0-4.63.63-6.5 1.72.12-2.35.3-4.82.3-7.47C5.8 4.28 8.63 2.25 12 2.25c3.37 0 6.2 2.03 6.2 6.25 0 2.65.18 5.12.3 7.47-1.87-1.09-4.07-1.72-6.5-1.72z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25L12 21.75M12 14.25A2.25 2.25 0 0114.25 12C14.25 10.76 13.24 9.75 12 9.75S9.75 10.76 9.75 12A2.25 2.25 0 0112 14.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 16.5c0-1.42-1.28-2.58-3-2.92" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 16.5c0-1.42 1.28-2.58 3-2.92" /><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12.75v3.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75v3.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 21.75l-3-3-3 3" /></svg>;
const ArrowPathIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l4.992-4.993m-4.993 0l-3.181 3.183a8.25 8.25 0 000 11.664l3.181 3.183" /></svg>;
const AdjustmentsHorizontalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>;
const CheckBadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CalendarDaysIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const NoSymbolIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
{/* FIX: Updated icon component to accept className for custom styling */}
const PlusCircleIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const MinusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const QuestionMarkCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ArrowUturnLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6 18.25m0 0a2.25 2.25 0 01-2.25 2.25m2.25-2.25a2.25 2.25 0 002.25 2.25M17.668 18.25l.252.252a2.25 2.25 0 01-3.182 3.182l-3.44-3.44a.25.25 0 01-.06-.128l-1.036-4.144a.25.25 0 01.3-.3l4.145-1.036a.25.25 0 01.128.06l3.44 3.44z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75h.008v.008H12V6.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5h.008v.008H16.5V7.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h.008v.008H4.5V12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h.008v.008H19.5V12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v.008h.008V4.5H12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5h.008v.008H7.5V16.5z" /></svg>;
{/* FIX: Updated icon component to accept className for custom styling */}
const ChevronDownIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const BuildingOffice2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m3.75-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" /></svg>;
const PresentationChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 14.25v-1.5c0-.621.504-1.125 1.125-1.125h13.5c.621 0 1.125.504 1.125 1.125v1.5m-15.75-9.75h15.75M4.5 12h15" /></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6.248a2.25 2.25 0 01-2.25 2.25h-13.5A2.25 2.25 0 013 18.248V12m18 0V7.638a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 7.638V12m18 0h-2.25m-13.5 0H3M15 5.25v.008h.008V5.25H15z" /></svg>;
const GlobeAltIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c1.353 0 2.662-.188 3.916-.524M12 3c-1.353 0-2.662.188-3.916.524M12 3v18M12 3a9.004 9.004 0 00-8.716 6.747M12 3a9.004 9.004 0 018.716 6.747M21 12a9.004 9.004 0 00-8.716-6.747M3 12a9.004 9.004 0 018.716-6.747M21 12c0 1.353-.188 2.662-.524 3.916M3 12c0 1.353.188 2.662.524 3.916m17.476-3.916c.336-1.254.524-2.563.524-3.916 0-1.353-.188-2.662-.524-3.916m-17.476 3.916c-.336-1.254-.524-2.563-.524-3.916 0-1.353.188-2.662.524-3.916" /></svg>;

// --- PLACEHOLDER MODALS / COMPONENTS ---
const AdvancedAnalysisModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => <Modal isOpen={isOpen} onClose={onClose} title="Advanced Class Analysis"><p>Feature coming soon.</p></Modal>;
const AIFeedbackModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => <Modal isOpen={isOpen} onClose={onClose} title="AI Feedback"><p>Feature coming soon.</p></Modal>;
const LessonPlanModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => <Modal isOpen={isOpen} onClose={onClose} title="Lesson Plan"><p>Feature coming soon.</p></Modal>;
const StudentGroupGeneratorModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => <Modal isOpen={isOpen} onClose={onClose} title="Student Group Generator"><p>Feature coming soon.</p></Modal>;
const ClassStatisticsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => <Modal isOpen={isOpen} onClose={onClose} title="Class Statistics"><p>Feature coming soon.</p></Modal>;
const SettingsModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => <Modal isOpen={isOpen} onClose={onClose} title={t('Settings')}><p>{t('Feature coming soon.')}</p></Modal>;
const AIStudentSummaryModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => <Modal isOpen={isOpen} onClose={onClose} title="AI Student Summary"><p>{t('Feature coming soon.')}</p></Modal>;
const AIParentCommsModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => <Modal isOpen={isOpen} onClose={onClose} title="AI Parent Comms"><p>{t('Feature coming soon.')}</p></Modal>;
const ManageBlocksModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => <Modal isOpen={isOpen} onClose={onClose} title="Manage Blocks"><p>{t('Feature coming soon.')}</p></Modal>;
const ExamGeneratorModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => <Modal isOpen={isOpen} onClose={onClose} title="Exam Generator"><p>{t('Feature coming soon.')}</p></Modal>;
const GenerateReportModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => <Modal isOpen={isOpen} onClose={onClose} title="Generate Report"><p>{t('Feature coming soon.')}</p></Modal>;
const ImportStudentsModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => <Modal isOpen={isOpen} onClose={onClose} title="Import Students"><p>{t('Feature coming soon.')}</p></Modal>;
const TakeAttendanceModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => <Modal isOpen={isOpen} onClose={onClose} title="Take Attendance"><p>{t('Feature coming soon.')}</p></Modal>;
const SeatingChart = ({ t }: { t: (key: string) => string }) => <div><p>{t('Feature coming soon.')}</p></div>;
const LessonPlanner = ({ t }: { t: (key: string) => string }) => <div><p>{t('Feature coming soon.')}</p></div>;
const ClassConductOverview = ({ t }: { t: (key: string) => string }) => <div><p>{t('Feature coming soon.')}</p></div>;

// --- AI COMPONENTS ---

const EvaluationToolGeneratorModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: (key: string) => string }) => {
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Primary School');
    const [type, setType] = useState('Rubric');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
        setResult('');
        setError('');
        try {
            const prompt = `Crea una detallada "${t(type)}" para un proyecto sobre "${topic}" para un nivel de "${t(level)}", alineada con los principios de la Nueva Escuela Mexicana (NEM). La herramienta debe ser práctica, fácil de entender para los docentes, y promover el compromiso comunitario y el pensamiento crítico. El resultado debe ser en español. Formatea la salida en Markdown.`;
            
            const generatedContent = await invokeAIFunction('generate-ai-content', { prompt });
            setResult(generatedContent);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        // Reset state on close
        setTopic('');
        setLevel('Primary School');
        setType('Rubric');
        setResult('');
        setError('');
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('NEM Evaluation Tool Generator')} size="lg">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-muted mb-1">{t('Topic or Subject')}</label>
                    <Input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('e.g., The Water Cycle, The Mexican Revolution')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">{t('Complexity Level')}</label>
                        <Select value={level} onChange={e => setLevel(e.target.value)}>
                            <option value="Primary School">{t('Primary School')}</option>
                            <option value="Middle School">{t('Middle School')}</option>
                            <option value="High School">{t('High School')}</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">{t('Output Type')}</label>
                        <Select value={type} onChange={e => setType(e.target.value)}>
                            <option value="Rubric">{t('Rubric')}</option>
                            <option value="Community Project Outline">{t('Community Project Outline')}</option>
                        </Select>
                    </div>
                </div>
                 <div className="flex justify-end">
                    <Button onClick={handleGenerate} disabled={isLoading || !topic}>
                        {isLoading ? t('Generating...') : <><SparklesIcon /> {t('Generate Tool')}</>}
                    </Button>
                </div>
            </div>
            
            {(isLoading || result || error) && (
                <div className="mt-6 pt-4 border-t border-base">
                    {isLoading && <div className="text-center text-muted">{t('Generating...')}</div>}
                    {error && <div className="p-3 bg-red-100 dark:bg-red-900/50 text-grade-fail rounded-md">{t('Error')}: {error}</div>}
                    {result && (
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

const AIToolsClass = ({ t }: { t: (key: string) => string }) => {
    const [isNemModalOpen, setIsNemModalOpen] = useState(false);

    const ToolCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
         <button onClick={onClick} className="bg-secondary p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left w-full h-full flex flex-col">
            <div className="flex items-center gap-4 mb-3">
                <div className="bg-primary-accent text-primary p-3 rounded-lg">{icon}</div>
                <h3 className="text-lg font-semibold text-base">{title}</h3>
            </div>
            <p className="text-sm text-muted flex-grow">{description}</p>
        </button>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-view-in">
             <header className="mb-6">
                <h2 className="text-2xl font-bold">{t('AI Tools')}</h2>
                <p className="text-muted mt-1">Harness the power of AI to streamline your teaching tasks.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <ToolCard 
                    icon={<DocumentDuplicateIcon/>} 
                    title={t('NEM Evaluation Tool Generator')} 
                    description={t('Instantly create rubrics and project outlines aligned with the Nueva Escuela Mexicana framework.')}
                    onClick={() => setIsNemModalOpen(true)}
                />
                {/* Future tool cards can be added here */}
            </div>
            
            <EvaluationToolGeneratorModal isOpen={isNemModalOpen} onClose={() => setIsNemModalOpen(false)} t={t} />
        </div>
    );
};


// --- AUTH COMPONENTS ---
const LoginView = ({ onLogin, t }: { onLogin: () => void, t: (key: string) => string }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base px-4">
            <div className="max-w-md w-full animate-view-in">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary">Maestro</h1>
                    <p className="text-muted mt-2">{t('Welcome to Maestro!')}</p>
                </div>
                <div className="bg-secondary shadow-xl rounded-lg p-8">
                    <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-muted mb-1">{t('Email Address')}</label>
                                <Input type="email" id="email" name="email" required placeholder="you@example.com" />
                            </div>
                            <div>
                                <div className="flex justify-between items-baseline">
                                    <label htmlFor="password" className="block text-sm font-medium text-muted mb-1">{t('Password')}</label>
                                    <a href="#" className="text-sm text-primary hover:underline">{t('Forgot Password?')}</a>
                                </div>
                                <Input type="password" id="password" name="password" required placeholder="••••••••" />
                            </div>
                            <div>
                                <Button type="submit" className="w-full justify-center py-2.5">{t('Login')}</Button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="text-center mt-6">
                    <p className="text-sm text-muted">
                        {t("Don't have an account? Sign Up")} <a href="#" className="font-semibold text-primary hover:underline">{t('Sign Up')}</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

// --- ADMIN / DIRECTOR COMPONENTS ---
type Teacher = { id: number; name: string; email: string; role: 'Teacher' | 'Admin'; };

const TeacherModal = ({ isOpen, onClose, onSave, teacher, t }: { isOpen: boolean, onClose: () => void, onSave: (teacher: Teacher) => Promise<void>, teacher: Teacher | null, t: (key: string) => string }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'Teacher' | 'Admin'>('Teacher');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (teacher) {
            setName(teacher.name);
            setEmail(teacher.email);
            setRole(teacher.role);
        } else {
            setName('');
            setEmail('');
            setRole('Teacher');
        }
    }, [teacher]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const teacherData = {
            id: teacher?.id || Date.now(),
            name,
            email,
            role,
        };
        await onSave(teacherData);
        setIsSaving(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={teacher ? t('Edit Teacher') : t('Add New Teacher')}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">{t('Name')}</label>
                        <Input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">{t('Email')}</label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">{t('Role')}</label>
                        <Select value={role} onChange={e => setRole(e.target.value as 'Teacher' | 'Admin')}>
                            <option value="Teacher">{t('Teacher')}</option>
                            <option value="Admin">{t('Admin')}</option>
                        </Select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>{t('Cancel')}</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? t('Saving...') : t('Save Changes')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


const AdminView = ({ t }: { t: (key: string) => string }) => {
    const [teachers, setTeachers] = useState<Teacher[]>([
        { id: 1, name: 'Prof. Victor Barrientos Arce', email: 'victor.arce@example.com', role: 'Teacher' },
        { id: 2, name: 'Laura Torres', email: 'laura.torres@example.com', role: 'Teacher' },
        { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    const handleAddTeacher = () => {
        setEditingTeacher(null);
        setIsModalOpen(true);
    };

    const handleEditTeacher = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleDeleteTeacher = (teacherId: number) => {
        if (window.confirm(t('Are you sure you want to delete this teacher?'))) {
            setTeachers(teachers.filter(t => t.id !== teacherId));
        }
    };

    const handleSaveTeacher = async (teacher: Teacher) => {
        // Simulate async save
        await new Promise(res => setTimeout(res, 500));
        if (teachers.some(t => t.id === teacher.id)) {
            setTeachers(teachers.map(t => t.id === teacher.id ? teacher : t));
        } else {
            setTeachers([...teachers, teacher]);
        }
    };

    const AdminCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
        <div className="bg-secondary rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary-accent text-primary p-3 rounded-lg">{icon}</div>
                <h3 className="text-xl font-semibold text-base">{title}</h3>
            </div>
            <div>{children}</div>
        </div>
    );
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-view-in">
             <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-base">{t('Administrator Panel')}</h1>
                    <p className="text-muted mt-1">{t('This is where administrators would manage teachers, school-wide settings, and billing.')}</p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AdminCard icon={<BuildingOffice2Icon/>} title={t('School Settings')}>
                     <p className="text-muted">{t('Feature coming soon.')}</p>
                </AdminCard>
                <AdminCard icon={<WalletIcon/>} title={t('Billing & Subscription')}>
                     <p className="text-muted">{t('Feature coming soon.')}</p>
                </AdminCard>
                 <AdminCard icon={<AcademicCapIcon/>} title={t('AI Toolkit')}>
                     <p className="text-muted">{t('Feature coming soon.')}</p>
                </AdminCard>
            </div>
            
            <div className="bg-secondary rounded-lg shadow-md">
                <div className="p-6 flex justify-between items-center border-b border-base">
                    <h3 className="text-xl font-semibold">{t('Manage Teachers')}</h3>
                    <Button onClick={handleAddTeacher} className="flex items-center gap-2">
                        <PlusIcon /> {t('Add New Teacher')}
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-tertiary">
                            <tr>
                                <th className="p-4 font-semibold text-sm">{t('Name')}</th>
                                <th className="p-4 font-semibold text-sm">{t('Email')}</th>
                                <th className="p-4 font-semibold text-sm">{t('Role')}</th>
                                <th className="p-4 font-semibold text-sm">{t('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base">
                            {teachers.map(teacher => (
                                <tr key={teacher.id}>
                                    <td className="p-4">{teacher.name}</td>
                                    <td className="p-4 text-muted">{teacher.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${teacher.role === 'Admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                                            {t(teacher.role)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <TooltipComponent text={t('Edit')}>
                                                <button onClick={() => handleEditTeacher(teacher)} className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-tertiary">
                                                    <PencilIcon />
                                                </button>
                                            </TooltipComponent>
                                            <TooltipComponent text={t('Delete')}>
                                                <button onClick={() => handleDeleteTeacher(teacher.id)} className="p-2 text-muted hover:text-grade-fail transition-colors rounded-full hover:bg-tertiary">
                                                    <TrashIcon />
                                                </button>
                                            </TooltipComponent>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <TeacherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTeacher}
                teacher={editingTeacher}
                t={t}
            />
        </div>
    );
};


const DirectorView = ({ t }: { t: (key: string) => string }) => {
    const DirectorCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
        <div className="bg-secondary rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary-accent text-primary p-3 rounded-lg">{icon}</div>
                <h3 className="text-xl font-semibold text-base">{title}</h3>
            </div>
            <div>{children}</div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-view-in">
             <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-base">{t('Director General Panel')}</h1>
                    <p className="text-muted mt-1">{t('This is where the general director would view school-wide analytics, reports, and overall performance metrics.')}</p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DirectorCard icon={<ChartBarIcon/>} title={t('School-wide Analytics')}>
                     <p className="text-muted">{t('Feature coming soon.')}</p>
                </DirectorCard>
                <DirectorCard icon={<GlobeAltIcon/>} title={t('Global Reports')}>
                     <p className="text-muted">{t('Feature coming soon.')}</p>
                </DirectorCard>
                 <DirectorCard icon={<PresentationChartBarIcon/>} title={t('Performance Dashboards')}>
                     <p className="text-muted">{t('Feature coming soon.')}</p>
                </DirectorCard>
            </div>
             <div className="bg-secondary rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">{t('Coming Soon')}</h3>
                <p className="text-muted">{t('More detailed dashboards and reporting tools will be available here.')}</p>
            </div>
        </div>
    );
};


// --- APP SKELETON LOADER ---
const SkeletonLoader = () => {
    const { t } = useTranslation();
    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <div className="h-8 bg-tertiary rounded w-48 shimmer mb-2"></div>
                    <div className="h-4 bg-tertiary rounded w-64 shimmer"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-10 bg-tertiary rounded-md w-24 shimmer"></div>
                    <div className="h-10 bg-tertiary rounded-md w-36 shimmer"></div>
                </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-secondary p-6 rounded-lg shadow-md space-y-4">
                        <div className="h-6 bg-tertiary rounded w-3/4 shimmer"></div>
                        <div className="h-4 bg-tertiary rounded w-1/2 shimmer"></div>
                        <div className="flex justify-between items-center pt-2">
                             <div className="h-5 bg-tertiary rounded w-20 shimmer"></div>
                             <div className="h-5 bg-tertiary rounded w-16 shimmer"></div>
                        </div>
                    </div>
                ))}
                <div className="border-2 border-dashed border-base rounded-lg flex flex-col items-center justify-center p-6 min-h-[160px]">
                    <div className="h-6 w-6 bg-tertiary rounded-full shimmer mb-2"></div>
                    <div className="h-5 w-32 bg-tertiary rounded shimmer"></div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENTS ---

const Header = ({
    selectedClass,
    onBackToDashboard,
    onExport,
    onImport,
    t,
    setLanguage,
    language,
    currentRole,
    onSwitchRole,
    onLogout
}: {
    selectedClass: ClassData | null,
    onBackToDashboard: () => void,
    onExport: () => void,
    onImport: () => void,
    t: (key: string, replacements?: Record<string, string | number>) => string,
    setLanguage: (lang: 'es' | 'en') => void,
    language: string,
    currentRole: 'teacher' | 'admin' | 'director',
    onSwitchRole: (role: 'teacher' | 'admin' | 'director') => void,
    onLogout: () => void,
}) => {
    const [theme, setTheme] = useState(() => localStorage.getItem('maestro-theme') || 'light');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('maestro-theme', theme);
    }, [theme]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };
    
    const RoleSwitcher = () => (
        <div ref={menuRef} className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-tertiary transition-colors">
                <UserIcon />
                <span className="font-semibold capitalize">{t(`${currentRole} View`)}</span>
                <ChevronDownIcon className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMenuOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-secondary rounded-md shadow-lg z-10 border border-base animate-modal-content origin-top-right">
                     <div className="py-1">
                        <button onClick={() => { onSwitchRole('teacher'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-base hover:bg-tertiary flex items-center gap-2">
                           <AcademicCapIcon /> {t('Teacher View')}
                        </button>
                         <button onClick={() => { onSwitchRole('admin'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-base hover:bg-tertiary flex items-center gap-2">
                           <BriefcaseIcon /> {t('Admin View')}
                        </button>
                         <button onClick={() => { onSwitchRole('director'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-base hover:bg-tertiary flex items-center gap-2">
                           <ChartBarIcon /> {t('Director View')}
                        </button>
                        <div className="border-t border-base my-1"></div>
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-base hover:bg-tertiary">{t('Logout')}</button>
                     </div>
                 </div>
            )}
        </div>
    );

    return (
        <header className="bg-secondary/80 backdrop-blur-sm sticky top-0 z-40 border-b border-base px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                    {selectedClass ? (
                        <>
                            <button onClick={onBackToDashboard} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-base transition-colors">
                                <ChevronLeftIcon />
                                <span>{t('Back to Dashboard')}</span>
                            </button>
                        </>
                    ) : (
                        <h1 className="text-xl font-bold text-primary">{t('Maestro')}</h1>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                     <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-tertiary text-muted hover:text-base transition-colors">
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    </button>
                     <div className="flex items-center">
                        <button onClick={() => setLanguage('es')} className={`px-2 py-1 text-sm rounded-l-md ${language === 'es' ? 'bg-primary text-inverted' : 'bg-tertiary'}`}>ES</button>
                        <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-sm rounded-r-md ${language === 'en' ? 'bg-primary text-inverted' : 'bg-tertiary'}`}>EN</button>
                    </div>

                    {!selectedClass && (
                         <div className="hidden sm:flex items-center gap-2">
                             <Button onClick={onImport} variant="secondary" className="flex items-center"><ArrowUpOnSquareIcon />{t('Import Data')}</Button>
                             <Button onClick={onExport} variant="secondary" className="flex items-center"><ArrowDownOnSquareIcon />{t('Export Data')}</Button>
                         </div>
                    )}
                    <RoleSwitcher />
                </div>
            </div>
        </header>
    );
};

const Dashboard = ({ classes, onSelectClass, onCreateClass, onDeleteClass, t }: { classes: ClassData[], onSelectClass: (id: number) => void, onCreateClass: () => void, onDeleteClass: (classId: number) => Promise<void>, t: (key: string, replacements?: Record<string, string | number>) => string }) => {
    
    const [classToDelete, setClassToDelete] = useState<ClassData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent, classData: ClassData) => {
        e.stopPropagation();
        setClassToDelete(classData);
    };

    const confirmDelete = async () => {
        if (classToDelete) {
            setIsDeleting(true);
            await onDeleteClass(classToDelete.id);
            setIsDeleting(false);
            setClassToDelete(null);
        }
    };
    
    return (
        <main className="p-4 sm:p-6 lg:p-8 animate-view-in">
            <h2 className="text-2xl font-bold text-base mb-6">{t('Your Classes')}</h2>
            
            {classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {classes.map((classData, index) => (
                        <div key={classData.id}
                            className="bg-secondary p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer stagger-in"
                            style={{ animationDelay: `${index * 50}ms`}}
                            onClick={() => onSelectClass(classData.id)}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-base mb-1">{classData.name}</h3>
                                 <button onClick={(e) => handleDeleteClick(e, classData)} className="p-1.5 text-muted hover:text-grade-fail rounded-full hover:bg-tertiary transition-colors -mr-2 -mt-2">
                                    <TrashIcon />
                                </button>
                            </div>
                            <p className="text-sm text-muted mb-4">{classData.semester}</p>
                            <div className="flex justify-between items-center text-sm text-muted">
                                <span className="flex items-center gap-1.5"><UserGroupIcon /> {classData.students.length} {t('Students')}</span>
                                {/* Add logic for at-risk students */}
                                <span className="font-semibold text-grade-fail">2 {t('At Risk')}</span>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={onCreateClass}
                        className="border-2 border-dashed border-base rounded-lg flex flex-col items-center justify-center p-6 text-muted hover:text-primary hover:border-primary transition-all min-h-[160px] stagger-in"
                        style={{ animationDelay: `${classes.length * 50}ms`}}
                    >
                        <PlusCircleIcon />
                        <span className="mt-2 font-semibold">{t('Create New Class')}</span>
                    </button>
                </div>
            ) : (
                <div className="text-center py-20 px-6 bg-secondary rounded-lg border border-base">
                    <h3 className="text-xl font-semibold mb-2">{t('Welcome to Maestro!')}</h3>
                    <p className="text-muted mb-6">{t("It looks like you don't have any classes yet. Create one to get started!")}</p>
                    <Button onClick={onCreateClass}>{t('Create New Class')}</Button>
                </div>
            )}
             <Modal isOpen={!!classToDelete} onClose={() => setClassToDelete(null)} title={t('Delete Class')}>
                {classToDelete && (
                    <div>
                        <p>{t('Are you sure you want to delete the class {className}?', { className: classToDelete.name })}</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setClassToDelete(null)}>{t('Cancel')}</Button>
                            <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? t('Deleting...') : t('Delete')}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    );
};


const ClassView = ({ classData, onUpdateGrade }: { classData: ClassData, onUpdateGrade: (studentId: number, assignmentId: string, grade: number | null) => Promise<void> }) => {
    const { t } = useTranslation();
    const [currentView, setCurrentView] = useState('gradebook');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredStudents = useMemo(() =>
        classData.students.filter(student =>
            student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ),
        [classData.students, debouncedSearchTerm]
    );

    const SidebarItem = ({ icon, label, viewName }: { icon: React.ReactNode, label: string, viewName: string }) => (
        <button
            onClick={() => setCurrentView(viewName)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                currentView === viewName ? 'bg-primary-accent text-primary' : 'hover:bg-tertiary text-muted'
            }`}
        >
            {icon}
            {label}
        </button>
    );
    
    // Placeholder content for different views
    const renderContent = () => {
        switch (currentView) {
            case 'gradebook':
                return <Gradebook t={t} classData={classData} onUpdateGrade={onUpdateGrade} filteredStudents={filteredStudents} />;
            case 'lesson_planner':
                return <LessonPlanner t={t} />;
            case 'seating_chart':
                return <SeatingChart t={t} />;
            case 'ai_tools':
                return <AIToolsClass t={t} />;
            case 'conduct':
                return <ClassConductOverview t={t} />;
            default:
                return <div>{t('Gradebook')}</div>;
        }
    };
    

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <aside className="w-64 bg-secondary border-r border-base p-4 flex-shrink-0">
                <div className="mb-6">
                    <h3 className="text-xl font-bold">{classData.name}</h3>
                    <p className="text-sm text-muted">{classData.semester}</p>
                </div>
                 <div className="relative mb-6">
                    <Input
                        type="text"
                        placeholder={t('Search student...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                     <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                     </div>
                </div>

                <nav className="space-y-2">
                    <SidebarItem icon={<BookOpenIcon />} label={t('Gradebook')} viewName="gradebook" />
                    <SidebarItem icon={<CalendarDaysIcon />} label={t('Lesson Planner')} viewName="lesson_planner" />
                    <SidebarItem icon={<ViewGridIcon />} label={t('Seating Chart')} viewName="seating_chart" />
                    <SidebarItem icon={<SparklesIcon />} label={t('AI Tools')} viewName="ai_tools" />
                    <SidebarItem icon={<CheckBadgeIcon />} label={t('Conduct')} viewName="conduct" />
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto bg-base">
                {renderContent()}
            </main>
        </div>
    );
};


const Gradebook = ({ classData, onUpdateGrade, filteredStudents, t }: { classData: ClassData, onUpdateGrade: (studentId: number, assignmentId: string, grade: number | null) => Promise<void>, filteredStudents: Student[], t: (key: string) => string}) => {
    // MODAL STATES
    const [isAddStudentModalOpen, setAddStudentModalOpen] = useState(false);
    const [isCreateAssignmentModalOpen, setCreateAssignmentModalOpen] = useState(false);
    const [isEditingStudent, setIsEditingStudent] = useState<Student | null>(null);
    const [isEditingAssignment, setIsEditingAssignment] = useState<Assignment | null>(null);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                 <div>
                    <h2 className="text-2xl font-bold">{t('Gradebook')}</h2>
                    {/* Add stats cards here */}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary">{t('Tools')}</Button>
                    <Button onClick={() => setCreateAssignmentModalOpen(true)}>{t('Create New Assignment')}</Button>
                </div>
            </header>
            
             <div className="overflow-x-auto bg-secondary rounded-lg shadow-md border border-base">
                <table className="w-full min-w-[800px] text-sm text-left">
                    <thead className="border-b border-base bg-tertiary">
                         <tr>
                            <th className="sticky left-0 bg-tertiary p-4 font-semibold w-56 min-w-56 z-10">{t('Student Name')}</th>
                            {classData.assignments.map(ass => <th key={ass.id} className="p-4 font-semibold text-center whitespace-nowrap">{ass.name}</th>)}
                            <th className="p-4 font-semibold text-center">{t('Final Average')}</th>
                         </tr>
                    </thead>
                    <tbody className="divide-y divide-base">
                        {filteredStudents.map(student => (
                            <GradebookRow 
                                key={student.id} 
                                student={student} 
                                assignments={classData.assignments} 
                                onUpdateGrade={onUpdateGrade}
                                classData={classData}
                                t={t}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredStudents.length === 0 && (
                <div className="text-center py-12 px-6 bg-secondary rounded-lg mt-4">
                    <h3 className="text-lg font-semibold">{t('No students in this class yet.')}</h3>
                    <Button onClick={() => setAddStudentModalOpen(true)} className="mt-4">{t('Add a Student')}</Button>
                </div>
            )}
        </div>
    );
};

const GradebookRow = ({ student, assignments, onUpdateGrade, classData, t }: { student: Student, assignments: Assignment[], onUpdateGrade: (studentId: number, assignmentId: string, grade: number | null) => Promise<void>, classData: ClassData, t: (key: string, replacements?: Record<string, string | number>) => string }) => {
    const studentAverage = useMemo(() => calculateAverage(student.grades, assignments), [student.grades, assignments]);
    const atRiskReasons = useMemo(() => isStudentAtRisk(student, classData), [student, classData]);

    return (
        <tr className="hover:bg-tertiary">
             <td className="sticky left-0 bg-secondary group-hover:bg-tertiary p-4 font-medium w-56 min-w-56 z-10 shadow-right-sm dark:shadow-right-dark-sm">
                <div className="flex items-center gap-2">
                    <span>{student.name}</span>
                    {atRiskReasons.length > 0 && (
                        <TooltipComponent text={t('At-risk due to: {reasons}', {reasons: atRiskReasons.join(', ')})}>
                            <ExclamationCircleIcon className="text-grade-fail" />
                        </TooltipComponent>
                    )}
                </div>
            </td>
            {assignments.map(ass => (
                <td key={ass.id} className="p-0 text-center">
                    <GradeCell 
                        grade={student.grades[ass.id]}
                        onUpdate={(newGrade) => onUpdateGrade(student.id, ass.id, newGrade)}
                        thresholds={classData.gradeThresholds}
                    />
                </td>
            ))}
             <td className={`p-4 text-center font-bold ${getGradeColor(studentAverage, classData.gradeThresholds)}`}>
                {studentAverage.toFixed(1)}
            </td>
        </tr>
    );
};

const GradeCell = ({ grade, onUpdate, thresholds }: { grade: number, onUpdate: (grade: number | null) => void, thresholds: GradeThresholds }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentGrade, setCurrentGrade] = useState<string>(grade?.toString() || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        const newGrade = parseFloat(currentGrade);
        if (isNaN(newGrade)) {
             if (grade !== undefined) onUpdate(null); // Clear the grade
        } else if (newGrade !== grade) {
            onUpdate(parseFloat(newGrade.toFixed(1)));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setCurrentGrade(grade?.toString() || '');
            setIsEditing(false);
        }
    };
    
    if (isEditing) {
        return (
             <input
                ref={inputRef}
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={currentGrade}
                onChange={e => setCurrentGrade(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-20 h-full text-center bg-tertiary border-2 border-primary outline-none py-4"
            />
        )
    }

    return (
        <div 
            onClick={() => setIsEditing(true)}
            className={`w-full h-full cursor-pointer flex items-center justify-center font-medium py-4 ${getGradeColor(grade, thresholds)}`}
        >
            {typeof grade === 'number' ? grade.toFixed(1) : '-'}
        </div>
    )
}

// --- APP ---

const App = () => {
    const { t, setLanguage, language } = useTranslation();
    const { classes, isLoading, createClass, deleteClass, addStudent, updateStudent, deleteStudent, updateGrade, createAssignment, updateAssignment, deleteAssignment, updateClassSettings, addConductEntry, updateAttendance, importStudents, updateSeatingChart, clearAllSeats, updateLessonPlan, importData, addBlock, deleteBlock } = useClasses();
    
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Phase 1: Auth state
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [isCreateClassModalOpen, setCreateClassModalOpen] = useState(false);
    const [activeRole, setActiveRole] = useState<'teacher' | 'admin' | 'director'>('teacher');


    const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId) || null, [classes, selectedClassId]);

    const handleCreateClass = () => {
        setCreateClassModalOpen(true);
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(classes, null, 2);
        const blob = new Blob([dataStr], {type: "application/json;charset=utf-8"});
        FileSaver.saveAs(blob, `maestro-export-${new Date().toISOString().split('T')[0]}.json`);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                 if (window.confirm(t('Are you sure you want to import data? This will overwrite your current classes.'))) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const imported = JSON.parse(event.target?.result as string);
                            // Basic validation
                            if (Array.isArray(imported) && imported.every(c => c.id && c.name)) {
                                importData(imported);
                            } else {
                                alert('Invalid file format.');
                            }
                        } catch (err) {
                            alert('Error reading file.');
                        }
                    };
                    reader.readAsText(file);
                }
            }
        };
        input.click();
    };

    const handleLogin = () => {
        // In a real app, this would involve API calls.
        // For Phase 1, we just toggle the state.
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    }
    
    if (!isAuthenticated) {
        return <LoginView onLogin={handleLogin} t={t} />
    }
    
    if (isLoading) {
        return <SkeletonLoader />;
    }

    const renderMainContent = () => {
        if (activeRole === 'admin') {
            return <AdminView t={t} />;
        }
        if (activeRole === 'director') {
            return <DirectorView t={t} />;
        }
        
        // Default to Teacher View
        if (selectedClass) {
            return <ClassView classData={selectedClass} onUpdateGrade={(studentId, assignmentId, grade) => updateGrade(selectedClass.id, studentId, assignmentId, grade)} />;
        } else {
            return <Dashboard classes={classes} onSelectClass={setSelectedClassId} onCreateClass={handleCreateClass} onDeleteClass={deleteClass} t={t} />;
        }
    };


    return (
        <div className="h-screen flex flex-col bg-base text-base">
            <Header
                selectedClass={selectedClass}
                onBackToDashboard={() => setSelectedClassId(null)}
                onExport={handleExport}
                onImport={handleImport}
                t={t}
                setLanguage={setLanguage}
                language={language}
                currentRole={activeRole}
                onSwitchRole={setActiveRole}
                onLogout={handleLogout}
            />
            {renderMainContent()}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);