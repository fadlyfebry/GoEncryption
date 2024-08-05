document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  const navButtons = document.querySelectorAll('.navbar button');

  // Function to hide all sections
  function hideAllSections() {
    sections.forEach(section => {
      section.classList.remove('active');
    });
  }

  // Function to show a specific section
  function showSection(sectionId) {
    hideAllSections();
    document.getElementById(sectionId).classList.add('active');
  }

  // Add event listeners to navigation buttons
  document.getElementById('homeBtn').addEventListener('click', () => showSection('home'));
  document.getElementById('aboutBtn').addEventListener('click', () => showSection('about'));
  document.getElementById('servicesBtn').addEventListener('click', () => showSection('services'));
 
});

document.addEventListener("DOMContentLoaded", function() {
  loadPage();
});

function loadPage() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (loggedInUser) {
    showEncryptionPage();
    loadEncryptedFiles();
    loadRegisteredUsers();
    displaySendFileOptions();
  } else {
    showLoginPage();
  }
}

function showLoginPage() {
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('register-section').style.display = 'none';
  document.getElementById('encryption-section').style.display = 'none';
}

function showRegisterPage() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'block';
  document.getElementById('encryption-section').style.display = 'none';
}

function showEncryptionPage() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'none';
  document.getElementById('encryption-section').style.display = 'block';
}

function validateLogin(event) {
  event.preventDefault();
  var username = document.getElementById("login-username").value;
  var password = document.getElementById("login-password").value;

  var users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

  var user = users.find(user => user.username === username && user.password === password);

  if (user) {
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    showEncryptionPage();
    loadEncryptedFiles();
    loadRegisteredUsers();
    displaySendFileOptions();
  } else {
    alert("Invalid username or password!");
  }
}

function registerUser(event) {
  event.preventDefault();
  var username = document.getElementById("register-username").value;
  var password = document.getElementById("register-password").value;

  var users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

  var userExists = users.some(user => user.username === username);

  if (userExists) {
    alert("Username already exists!");
  } else {
    users.push({ username: username, password: password });
    localStorage.setItem("registeredUsers", JSON.stringify(users));
    alert("Registration successful!");
    showLoginPage();
  }
}

let encryptedFiles = [];
let registeredUsers = [];

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('file-content').value = e.target.result;
    document.getElementById('original-filename').value = file.name;
  };
  reader.readAsText(file);
}

function downloadFile(content, fileName) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: 'application/octet-stream' });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

function encryptFile() {
  const fileInput = document.getElementById('fileInput');
  const password = document.getElementById('password').value;

  if (!fileInput.files.length || !password) {
    alert('Please select a file and enter a password.');
    return;
  }

  const file = fileInput.files[0];
  const fileName = file.name;
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
  const reader = new FileReader();

  reader.onload = function(event) {
    const fileData = event.target.result;
    const wordArray = CryptoJS.lib.WordArray.create(fileData);
    const encrypted = CryptoJS.AES.encrypt(wordArray, password).toString();
    const encryptedWithExtension = encrypted + fileExtension;
    downloadFile(encryptedWithExtension, file.name + '.enc');
    saveEncryptedFile(encryptedWithExtension, file.name + '.enc');
  };

  reader.readAsArrayBuffer(file);
}

function decryptFile(encryptedContent, fileName) {
  const password = document.getElementById('password').value;

  if (!password) {
    alert('Please enter a password.');
    return;
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, password);
    const decryptedBytes = decrypted.toString(CryptoJS.enc.Base64);
    const byteCharacters = atob(decryptedBytes);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
    downloadFile(blob, fileName.replace('.enc', ''));
  } catch (e) {
    alert('Decryption failed: ' + e.message);
  }
}

function saveFile(content, filename, type) {
  const blob = new Blob([content], { type: type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function saveEncryptedFile(content, filename) {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("No user logged in.");
    return;
  }

  const file = {
    name: filename,
    content: content,
    user: loggedInUser.username
  };

  encryptedFiles.push(file);
  localStorage.setItem('encryptedFiles', JSON.stringify(encryptedFiles));
  displayEncryptedFiles();
  displaySendFileOptions();
}

function saveDecryptedFile(content, filename) {
  saveFile(content, filename, 'text/plain');
}

function loadEncryptedFiles() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("No user logged in.");
    return;
  }

  const storedFiles = localStorage.getItem('encryptedFiles');
  if (storedFiles) {
    encryptedFiles = JSON.parse(storedFiles);
    displayEncryptedFiles();
    displaySendFileOptions();
  }
}

function displayEncryptedFiles() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const list = document.getElementById('encrypted-files');
  list.innerHTML = '';

  encryptedFiles.filter(file => file.user === loggedInUser.username || file.receiver === loggedInUser.username).forEach((file, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = file.name;

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download';
    downloadButton.onclick = () => {
      saveFile(file.content, file.name, 'text/plain');
    };

    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load';
    loadButton.onclick = () => {
      document.getElementById('output').textContent = file.content;
      document.getElementById('loaded-filename').value = file.name;
      document.getElementById('original-filename').value = file.name;
      decryptFile(file.content, file.name);  // Decrypt the loaded file
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => {
      deleteEncryptedFile(index);
    };

    listItem.appendChild(downloadButton);
    listItem.appendChild(loadButton);
    listItem.appendChild(deleteButton);
    list.appendChild(listItem);
  });
}

function deleteEncryptedFile(index) {
  encryptedFiles.splice(index, 1);
  localStorage.setItem('encryptedFiles', JSON.stringify(encryptedFiles));
  displayEncryptedFiles();
  displaySendFileOptions();
}

function loadRegisteredUsers() {
  registeredUsers = JSON.parse(localStorage.getItem('users')) || [];
}

function displaySendFileOptions() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const fileList = document.getElementById('file-list');
  fileList.innerHTML = '';

  encryptedFiles.filter(file => file.user === loggedInUser.username).forEach(file => {
    const listItem = document.createElement('div');
    listItem.classList.add('file-item');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = file.name;
    checkbox.id = `file-${file.name}`;
    
    const label = document.createElement('label');
    label.htmlFor = `file-${file.name}`;
    label.textContent = file.name;

    listItem.appendChild(checkbox);
    listItem.appendChild(label);
    fileList.appendChild(listItem);
  });
}

function sendSelectedFilesToUser() {
  const username = document.getElementById('user-search').value;
  const checkboxes = document.querySelectorAll('#file-list input[type="checkbox"]:checked');
  if (!username) {
    alert("Please enter a username.");
    return;
  }
  
  const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
  const receiver = users.find(user => user.username === username);
  if (!receiver) {
    alert("User not found.");
    return;
  }

  checkboxes.forEach(checkbox => {
    const fileName = checkbox.value;
    const file = encryptedFiles.find(file => file.name === fileName);
    if (file) {
      file.receiver = username;
    }
  });

  localStorage.setItem('encryptedFiles', JSON.stringify(encryptedFiles));
  displayEncryptedFiles();
  alert("Files sent successfully.");
}

function logout() {
  localStorage.removeItem("loggedInUser");
  showLoginPage();
}
