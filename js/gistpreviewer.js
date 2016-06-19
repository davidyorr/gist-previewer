var jsFiles = [];
var cssFiles = [];

function initFileObjects(sourceCode) {
  var fileboxDivs = document.getElementsByClassName('file-box');
  for (var i = 0; i < fileboxDivs.length; i++) {
    var fileHeaderDiv = fileboxDivs[i].getElementsByClassName('file-header')[0];
    var fileActionsDiv = fileHeaderDiv.getElementsByClassName('file-actions')[0];
    var filetype = getFileType(fileboxDivs[i]);

    if (filetype === 'javascript' || filetype === 'css') {
      var linkURL = getLinkURL(fileActionsDiv);
      filetype === 'javascript' ? jsFiles.push({url:linkURL}) : cssFiles.push({url:linkURL});
    }
  }
};

function injectPreviewHTMLButtons() {
  var fileboxDivs = document.getElementsByClassName('file-box');
  for (var i = 0; i < fileboxDivs.length; i++) {
    var fileHeaderDiv = fileboxDivs[i].getElementsByClassName('file-header')[0];
    if (!fileHeaderDiv) {
	    return;
    }
    var fileActionsDiv = fileHeaderDiv.getElementsByClassName('file-actions')[0];
    var filetype = getFileType(fileboxDivs[i]);
    if (filetype === 'html') {
      var linkURL = getLinkURL(fileActionsDiv);
      // make sure we haven't already added it
      if (fileActionsDiv.getElementsByClassName('gistpreview-button').length === 0) {
        var previewButtonA = document.createElement('a');
        previewButtonA.innerHTML = 'Preview HTML';
        previewButtonA.onclick = onPreviewButtonClicked;
        previewButtonA.className = 'btn btn-sm gistpreview-button';
        previewButtonA['data-linkURL'] = linkURL;
        fileActionsDiv.appendChild(previewButtonA);
      }
    }
  }
};

// Event Handlers
// -----------------------------------------------------------------------------

function onPreviewButtonClicked() {
  var theatreOverlayDiv = document.getElementById('gistpreview-overlay');
  if (theatreOverlayDiv === null) {
    theatreOverlayDiv = document.createElement('div');
    theatreOverlayDiv.id = 'gistpreview-overlay';
    theatreOverlayDiv.addEventListener('mousedown', onTheatreOverlayClicked, false);
    document.body.insertBefore(theatreOverlayDiv, null);
  }
  var previewWindowDiv = document.createElement('div');
  previewWindowDiv.id = 'gistpreview-window';
  var iframe = document.createElement('iframe');
  iframe.id = 'gistpreview-iframe';
  document.body.insertBefore(iframe, null);
  previewWindowDiv.appendChild(iframe);
  document.body.insertBefore(previewWindowDiv, null);
  theatreOverlayDiv.classList.remove('gistpreview-fadeOutOverlay');
  theatreOverlayDiv.classList.add('gistpreview-fadeInOverlay');

  chrome.runtime.sendMessage({
    htmlUrl: this['data-linkURL'],
    jsFiles: jsFiles,
    cssFiles: cssFiles
  }, function(response) {
    iframe.src = 'data:text/html;charset=utf-8,'+encodeURI(response.sourceCode);
  });
};

function onTheatreOverlayClicked() {
  var previewWindowDiv = document.getElementById('gistpreview-window');
  previewWindowDiv.parentNode.removeChild(previewWindowDiv);
  var theatreOverlayDiv = document.getElementById('gistpreview-overlay');
  theatreOverlayDiv.classList.remove('gistpreview-fadeInOverlay');
  theatreOverlayDiv.classList.add('gistpreview-fadeOutOverlay');
};

// Util
// -----------------------------------------------------------------------------

function getFileType(fileBoxDiv) {
  var blobWrapperDiv = fileBoxDiv.getElementsByClassName('blob-wrapper')[0];
  var classes = blobWrapperDiv.className.split(' ');
  for (var i = 0; i < classes.length; i++) {
    if (classes[i].indexOf('type-') === 0) {
      return classes[i].substring(5);
    }
  }
}

function getLinkURL(fileActionsDiv) {
  for (var j = 0; j < fileActionsDiv.children.length; j++) {
    if (fileActionsDiv.children[j].innerHTML === 'Raw') {
      return fileActionsDiv.children[j].href;
    }
  }
}

// Init
// -----------------------------------------------------------------------------

initFileObjects();
injectPreviewHTMLButtons();

