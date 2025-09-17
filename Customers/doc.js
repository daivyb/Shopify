//https://docs.google.com/document/d/1Lu-23dsV_BGll3mXi5AEujZ-DgrFRnj2x4IL6tBp95k/edit?tab=t.0
function createLabelSamplesDoc() {
	var user = Session.getActiveUser().getEmail();
	var labels = GmailApp.getUserLabels();
	var doc = DocumentApp.create('Muestras de sublabels Gmail - ' + user);
	var body = doc.getBody();
	var maxChars = 1024;

	// Agrupar labels principales
	var mainLabels = {};
	labels.forEach(function(label) {
		var parts = label.getName().split('/');
		if (parts.length > 1) {
			var main = parts[0];
			if (!mainLabels[main]) mainLabels[main] = [];
			mainLabels[main].push(label);
		}
	});

	['Inquiry', 'Complaint'].forEach(function(main) {
		if (!mainLabels[main]) return;
		body.appendParagraph('Label principal: ' + main).setHeading(DocumentApp.ParagraphHeading.HEADING1);
		mainLabels[main].forEach(function(label) {
			body.appendParagraph('Sublabel: ' + label.getName()).setHeading(DocumentApp.ParagraphHeading.HEADING2);
			var threads = label.getThreads(0, 10); // Buscar hasta 10 hilos para asegurar 3 muestras
			var samples = 0;
			for (var t = 0; t < threads.length && samples < 3; t++) {
				var messages = threads[t].getMessages();
				for (var m = 0; m < messages.length && samples < 3; m++) {
					var msg = messages[m];
					body.appendParagraph('Muestra ' + (samples+1) + ':').setHeading(DocumentApp.ParagraphHeading.HEADING3);
					body.appendParagraph('Asunto: ' + msg.getSubject());
					body.appendParagraph('De: ' + msg.getFrom());
					body.appendParagraph('Fecha: ' + msg.getDate());
					var content = msg.getPlainBody().replace(/\r?\n|\r/g, ' ');
					var limitedContent = content.substring(0, maxChars);
					body.appendParagraph('Contenido: ' + limitedContent);
					body.appendParagraph('---');
					samples++;
				}
			}
			body.appendParagraph('');
		});
	});
	doc.saveAndClose();
	Logger.log('Documento creado: ' + doc.getUrl());
}

