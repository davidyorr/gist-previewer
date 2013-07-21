
function saveSettings() {
  // var select = document.getElementById('jQuery');
  // var library = select.children[select.selectedIndex].value;
  // localStorage['jQuery library'] = library;

  var button = document.getElementById('saveButton');
  button.innerHTML = 'Settings saved!';
  button.disabled = true;
  setTimeout(function() {
    button.innerHTML = 'Save';
    button.disabled = false;
  }, 1000);
};

document.querySelector('#saveButton').addEventListener('click', saveSettings);