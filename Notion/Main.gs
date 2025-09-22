// Módulo Principal
// Orquesta las llamadas y procesa los datos.

function readNotionDatabase() {
  Logger.log('Iniciando lectura de la base de datos de Notion...');
  
  const jsonResponse = queryNotionDatabase(DATABASE_ID);

  if (!jsonResponse || !jsonResponse.results) {
    Logger.log('No se pudo obtener una respuesta válida de la API de Notion. Revisa los registros anteriores para ver si hay errores.');
    return;
  }
  
  const results = jsonResponse.results;
  
  Logger.log(`Se encontraron ${results.length} filas en la base de datos.`);
  Logger.log('--- Ejemplo de Lectura de Columnas ---');

      if (results.length > 0) {
        results.forEach((page, index) => {
          Logger.log(`
--- Fila ${index + 1} ---`);
          
          // --- Columna: Task name (Title) ---
          const taskNameProp = page.properties['Task name'];
          if (taskNameProp && taskNameProp.title && taskNameProp.title.length > 0) {
            Logger.log(`Task name: ${taskNameProp.title[0].plain_text}`);
          }

          // --- Columna: Status (Status) ---
          const statusProp = page.properties['Status'];
          if (statusProp && statusProp.status) {
            Logger.log(`Status: ${statusProp.status.name}`);
          }

          // --- Columna: Assignee (Person) ---
          const assigneeProp = page.properties['Assignee'];
          if (assigneeProp && assigneeProp.people && assigneeProp.people.length > 0) {
            const assignees = assigneeProp.people.map(person => person.name).join(', ');
            Logger.log(`Assignee: ${assignees}`);
          }

          // --- Columna: Due Date (Date) ---
          const dueDateProp = page.properties['Due Date'];
          if (dueDateProp && dueDateProp.date) {
            Logger.log(`Due Date: ${dueDateProp.date.start}`);
          }

          // --- Columna: Priority (Select) ---
          const priorityProp = page.properties['Priority'];
          if (priorityProp && priorityProp.select) {
            Logger.log(`Priority: ${priorityProp.select.name}`);
          }
        });
      } else {
        Logger.log('No se encontraron resultados (filas) en la base de datos.');
      }
}
