var sourceCode;
var htmlUrl;
var jsFiles;
var cssFiles;
var reqAjaxReqs = 1;
var fetches = 0;
var contentScriptCallback;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // reset vars
  contentScriptCallback = sendResponse;
  htmlUrl = request.htmlUrl;
  jsFiles = request.jsFiles;
  cssFiles = request.cssFiles;
  fetches = 0;
  // count number of ajax requests needed
  reqAjaxReqs = 1; // html file
  reqAjaxReqs += jsFiles.length;
  reqAjaxReqs += cssFiles.length;

  compileSrcDoc();
  return true; // lets content script know we are sending a response asynchronously
});

function compileSrcDoc() {
  fetchHtml();
  fetchJs();
  fetchCss();
};

function onFetchComplete() {
  fetches++;
  if (fetches < reqAjaxReqs) return;
  injectJs();
  injectCss();
  contentScriptCallback({'sourceCode': sourceCode});
};

function fetchHtml(callback, sendResponse) {
  var xhReq = new XMLHttpRequest();
    xhReq.onreadystatechange = function() {
    if (xhReq.readyState === 4 && xhReq.status === 200) {
      sourceCode = xhReq.responseText;
      onFetchComplete();
    }
  };
  xhReq.open('GET', htmlUrl, true);
  xhReq.send(null);
};

function fetchSrc(file) {
  var xhReq = new XMLHttpRequest();
  xhReq.onreadystatechange = function() {
    if (xhReq.readyState === 4 && xhReq.status === 200) {
      file.src = xhReq.responseText;
      onFetchComplete();
    }
  };
  xhReq.open('GET', file.url, true);
  xhReq.send(null);
};

function fetchJs() {
  for (var i = 0; i < jsFiles.length; i++) {
    fetchSrc(jsFiles[i]);
  }
};

function fetchCss(sourceCode) {
  for (var i = 0; i < cssFiles.length; i++) {
    fetchSrc(cssFiles[i]);
  }
};

function injectJs() {
  var pos = sourceCode.indexOf('</body>') > -1 ? sourceCode.indexOf('</body>')
    : sourceCode.indexOf('</html>') > -1 ? sourceCode.indexOf('</html>')
    : sourceCode.length;

  for (var i = 0; i < jsFiles.length; i++) {
    var jsCode = jsFiles[i].src;
    if (normalizeCode(sourceCode).indexOf(normalizeCode(jsCode)) > -1) continue;
    sourceCode = stringSplice(sourceCode, pos, '<script>'+jsCode+'</script>');
  }
};

function injectCss() {
  var pos = sourceCode.indexOf('</head>') > -1 ? sourceCode.indexOf('</head>')
    : sourceCode.indexOf('<html>') > -1 ? sourceCode.indexOf('<html>') + 6
    : 0;

  for (var i = 0; i < cssFiles.length; i++) {
    var cssCode = cssFiles[i].src;
    if (normalizeCode(sourceCode).indexOf(normalizeCode(cssCode)) > -1) continue;
    sourceCode = stringSplice(sourceCode, pos, '<br><style>'+cssCode+'</style><br>');
  }
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

function stringSplice(str, idx, insertStr) {
  return idx > 0
    ? str.slice(0, idx) + insertStr + str.slice(idx, str.length)
    : insertStr + str;
};

