/**
 * Gist Previewer
 *
 * Copyright 2013 David Orr
 *
 * Released under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */

// References
// -----------------------------------------------------------------------------

var jsFiles = [];
var cssFiles = [];
var previewWindowContainerDiv;
var previewWindowDiv;
var previewIFrame;
var previewWindowPanel;
var theatreOverlayDiv;
var bottomResizeDiv;
var prevBrowserWidth = window.outerWidth;
var prevBrowserHeight = window.outerHeight;

// File
// -----------------------------------------------------------------------------

function File(url) {
  this.url = url;
};

function initFileObjects(sourceCode) {
  var fileboxDivs = document.getElementsByClassName('file-box');
  for (var i = 0; i < fileboxDivs.length; i++) {
    var fileboxDiv = fileboxDivs[i];
    var metaDiv = getFirstChildWithClass(fileboxDiv, 'meta');
    var fileActionsDiv = getFirstChildWithClass(metaDiv, 'file-actions');
    var filetype = getFirstChildWithClass(fileActionsDiv, 'file-language').innerHTML;

    if (filetype === 'JavaScript' || filetype === 'CSS') {
      var buttonGroupDiv = getFirstChildWithClass(fileActionsDiv, 'button-group');
      var buttons = buttonGroupDiv.children;
      var linkURL = undefined;
      for (var j = 0; j < buttons.length; j++) {
        if (linkURL === undefined) {
          linkURL = getFirstChildWithClass(buttons[j], 'raw-url');
        }
      }

      var file = new File(linkURL.href);
      filetype === 'JavaScript' ? jsFiles.push(file) : cssFiles.push(file);
    }
  }
  retrieveJs(sourceCode);
};

// Inject the JavaScript and CSS code into the HTML file
// -----------------------------------------------------------------------------

function retrieveJs(sourceCode) {
  if (jsFiles.length === 0) {
    retrieveCss(sourceCode);
    return;
  }
  var pos = sourceCode.indexOf('</body>');

  if (pos === -1) {
    pos = sourceCode.indexOf('</html>');
  }
  if (pos === -1) {
    pos = sourceCode.length;
  }

  for (var i = 0; i < jsFiles.length; i++) {
    var file = jsFiles[i];
    var xhReq = new XMLHttpRequest();
    xhReq.onreadystatechange = function() {
      if (xhReq.readyState === 4 && xhReq.status === 200) {
        sourceCode = addJs(sourceCode, xhReq.responseText, pos);
        if (cssFiles.length === 0) {
          displayWindow(sourceCode);
        } else {
          retrieveCss(sourceCode);
        }
      }
    };
    xhReq.open('GET', file.url, false);
    xhReq.send(null);
  }
};

function addJs(sourceCode, jsCode, pos) {
  if (normalizeCode(sourceCode).indexOf(normalizeCode(jsCode)) > -1) {
    return sourceCode;
  }
  return stringSplice(sourceCode, pos, '<script>'+jsCode+'</script>');
};

// removes a lot of unneccesary stuff in the code,
// such as extra spaces, blank lines, etc.
// we use this in cases where one of html file in the gist repo
// contains another js or css file in it that is also in the repo.
function normalizeCode(code) {
  // remove lines that contain only spaces
  var split = code.split('\n');
  for (var i = 0; i < split.length; i++) {
    var empty = true;
    var line = split[i];
    for (var j = 0; j < line.length; j++) {
      if (line.charAt(j) !== ' ') {
        empty = false;
        break;
      }
    }
    if (empty) {
      split.splice(i, 1);
    }
  }
  code = split.join('');

  // convert multiple blank lines into a single blank line
  // and multiple tab chars into single tab char
  code = code.replace(/\n{2,}/g, '\n').replace(/\t{2,}/g, '\t');

  return code;
};

function retrieveCss(sourceCode) {
  if (cssFiles.length === 0) {
    displayWindow(sourceCode);
    return;
  }
  var pos = sourceCode.indexOf('</head>');

  if (pos === -1) {
    var pos = sourceCode.indexOf('<html>');
    if (pos !== -1) {
      pos += 6;
    }
    pos = pos;
  }
  if (pos === -1) {
    pos = 0;
  }

  for (var i = 0; i < cssFiles.length; i++) {
    var file = cssFiles[i];
    var xhReq = new XMLHttpRequest();
    xhReq.onreadystatechange = function() {
      if (xhReq.readyState === 4 && xhReq.status === 200) {
        sourceCode = addCss(sourceCode, xhReq.responseText, pos);
        if (i === cssFiles.length-1) {
          displayWindow(sourceCode);
        }
      }
    };
    xhReq.open('GET', file.url, false);
    xhReq.send(null);
  }
};

function addCss(sourceCode, cssCode, pos) {
  if (normalizeCode(sourceCode).indexOf(normalizeCode(cssCode)) > -1) {
    return sourceCode;
  }
  return stringSplice(sourceCode, pos, '<br><style>'+cssCode+'</style><br>');
};

// Inject the 'Preview HTML' button at the top of each file
// -----------------------------------------------------------------------------

function injectPreviewHTMLButtons(interval) {
  var fileboxDivs = document.getElementsByClassName('file-box');
  for (var i = 0; i < fileboxDivs.length; i++) {
    var metaDiv = getFirstChildWithClass(fileboxDivs[i], 'meta');
    if (!metaDiv) {
      return;
    }
    clearInterval(interval);
    var fileActionsDiv = getFirstChildWithClass(metaDiv, 'file-actions');
    var filetype = getFirstChildWithClass(fileActionsDiv, 'file-language').innerHTML;
    if (filetype === 'HTML') {
      var buttonGroupDiv = getFirstChildWithClass(fileActionsDiv, 'button-group');
      var buttons = buttonGroupDiv.children;
      var linkURL = undefined;
      for (var j = 0; j < buttons.length; j++) {
        if (linkURL === undefined) {
          linkURL = getFirstChildWithClass(buttons[j], 'raw-url');
        }
      }
      linkURL = linkURL.href;
      // make sure we haven't already added it
      if (!getFirstChildWithClass(buttonGroupDiv, 'gistpreview-li')) {
        var previewButtonLi = document.createElement('li');
        previewButtonLi.className = 'gistpreview-li';
        var previewButtonSpan = document.createElement('span');
        previewButtonSpan.className = 'gistpreview-runButton';
        previewButtonSpan['data-linkURL'] = linkURL;
        previewButtonSpan.innerHTML = 'Preview HTML';
        previewButtonLi.appendChild(previewButtonSpan);
        buttonGroupDiv.appendChild(previewButtonLi);

        previewButtonSpan.addEventListener('mousedown', runButtonHandler, false);
      }
    }
  }
};

// Window UI
// -----------------------------------------------------------------------------

function displayWindow(sourceCode) {
  previewWindowDiv = document.createElement('div');
  previewIFrame = document.createElement('iframe');
  previewWindowPanel = buildPanel();
  theatreOverlayDiv = document.createElement('div');
  bottomResizeDiv = document.createElement('div');

  previewWindowDiv.id = 'gistpreview-window';
  theatreOverlayDiv.id = 'gistpreview-overlay';
  bottomResizeDiv.id = 'gistpreview-resizer';
  previewWindowPanel.className = 'gistpreview-panel';
  previewIFrame.id = 'gistpreview-iframe';
  previewIFrame.srcdoc = sourceCode;

  previewWindowDiv.appendChild(previewWindowPanel);
  previewWindowDiv.appendChild(previewIFrame);
  previewWindowDiv.appendChild(bottomResizeDiv);
  document.body.insertBefore(previewWindowDiv);
  document.body.insertBefore(theatreOverlayDiv);
  fadeInDiv(theatreOverlayDiv, 0.6);

  previewIFrame.addEventListener('load', setIFrameHeight, false);
  bottomResizeDiv.addEventListener('mousedown', startResize, false);

  repositionPreviewWindow(null, true);
  window.onresize = repositionPreviewWindow;
};

function buildPanel() {
  var div = document.createElement('div');
  div.className = 'gistpreview-panel';
  var closeButton = buildPanelButton('Close', 'gistpreview-close');
  closeButton.addEventListener('mousedown', closeButtonHandler, false);
  div.appendChild(closeButton);

  return div;
};

function buildPanelButton(text, id) {
  var div = document.createElement('div');
  div.className = 'gistpreview-panelButton';
  div.innerHTML = text;
  div.id = id;

  return div;
};

function setIFrameHeight() {
  var body = this.contentDocument.body;
  var height = Math.max(body.scrollHeight, body.offsetHeight);
  height += 35; // little cushion
  this.style.height = height + 'px';
};

// Repositioning when browser size changes
// -----------------------------------------------------------------------------

// force : force the function to execute
function repositionPreviewWindow(evt, force) {
  var windowOuterHeight = window.outerHeight;
  var windowOuterWidth = window.outerWidth;

  if (prevBrowserHeight === windowOuterHeight &&
        prevBrowserWidth === windowOuterWidth &&
        !force) {
    return;
  }
  prevBrowserHeight = windowOuterHeight;
  prevBrowserWidth = windowOuterWidth;

  var top = window.innerHeight/10+window.scrollY;
  var left = window.innerWidth/10;

  previewWindowDiv.style.top = top + 'px';
  previewWindowDiv.style.left = left + 'px';
};

// Fade effects
// -----------------------------------------------------------------------------

function fadeInDiv(div, max, callback) {
  fadeDiv(div, max, 0.04, callback);
};

function fadeOutDiv(div, callback) {
  fadeDiv(div, 0, -0.04, callback)
};

function fadeDiv(div, max, step, callback) {
  div.style.opacity = (+(div.style.opacity) + step).toFixed(2);
  var opacity = step > 0 ? +div.style.opacity : -div.style.opacity;
  if (opacity < max) {
    setTimeout(function() {
      fadeDiv(div, max, step, callback);
    }, 2);
  } else {
    if (typeof callback === 'function') {
      callback();
    }
  }
};

// Button Handlers
// -----------------------------------------------------------------------------

function runButtonHandler(e) {
  // when the request is complete, starts a chain
  // initFileObjects -> retrieveJs -> [retrieveCss] -> displayWindow
  var xhReq = new XMLHttpRequest();
  xhReq.onreadystatechange = function() {
    if (xhReq.readyState === 4 && xhReq.status === 200) {
      initFileObjects(xhReq.responseText);
    }
  };
  xhReq.open('GET', this['data-linkURL'], false);
  xhReq.send(null);

  return false;
};

function closeButtonHandler(e) {
  previewWindowDiv.parentNode.removeChild(previewWindowDiv);
  fadeOutDiv(theatreOverlayDiv, function() {
    theatreOverlayDiv.parentNode.removeChild(theatreOverlayDiv)
  });
  jsFiles.length = 0;
  cssFiles.length = 0;
};

// Resizing the window
// -----------------------------------------------------------------------------

var startY, startHeight;
function startResize(e) {
  startY = e.clientY;
  startHeight = parseInt(previewIFrame.style.height.slice(0, -2));

  document.addEventListener('mousemove', doResize, false);
  previewIFrame.contentDocument.addEventListener('mousemove', doResize, false);
  document.addEventListener('mouseup', stopResize, false);
};

function doResize(e) {
  var height = previewIFrame.style.height.slice(0, -2);
  var newHeight;

  if (e.srcElement === bottomResizeDiv ||
      e.srcElement === document ||
      e.srcElement === previewWindowDiv ||
      e.srcElement === theatreOverlayDiv) {
    newHeight = startHeight + e.clientY - startY;
  } else {
    newHeight = e.clientY;
  }

  if (newHeight > 45) {
    previewIFrame.style.height = newHeight + 'px';
  }
};

function stopResize(e) {
  document.removeEventListener('mousemove', doResize, false);
  previewIFrame.contentDocument.removeEventListener('mousemove', doResize, false);
  document.removeEventListener('mouseup', stopResize, false);
};

// Util
// -----------------------------------------------------------------------------

function getFirstChildWithClass(parentDiv, className) {
  var children = parentDiv.children;
  for (var i = 0; i < children.length; i++) {
    if (children[i].className.indexOf(className) > -1) {
      return children[i];
    }
  }
};

function stringSplice(str, idx, insertStr) {
  if (idx > 0) {
    return str.slice(0, idx) + insertStr + str.slice(idx, str.length);
  } else {
    return insertStr + str;
  }
}

// Init
// -----------------------------------------------------------------------------

function init() {
  var interval = setInterval(function() {
    injectPreviewHTMLButtons(interval);
  }, 500);
}

// returns true if a link was clicked
function urlChanged(target) {
  if (!target) {
    return false;
  }

  if (target.tagName === 'A') {
    return true;
  } else {
    return urlChanged(target.parentNode);
  }
}

function handleUrlChange(e) {
  if (urlChanged(e.target)) {
    init();
  }
}

// GitHub changes pages using ajax, so we catch when a link is clicked
window.addEventListener('mousedown', handleUrlChange, false);
window.addEventListener('keydown', handleUrlChange, false);

// if the gist is reached directly
init();