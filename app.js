// Initialize books array from localStorage or set to an empty array if not present
let books = JSON.parse(localStorage.getItem('books')) || [];

// Get references to DOM elements
const bookForm = document.getElementById('book-form');
const bookList = document.getElementById('book-list');
const searchInput = document.getElementById('search');
const filterStatus = document.getElementById('filter-status');
const importInput = document.getElementById('import-csv');
const loginForm = document.getElementById('login-form');
const profileSection = document.getElementById('profile');
const profileUsername = document.getElementById('profile-username');
const logoutButton = document.getElementById('logout-button');

// Save books array to localStorage
function saveBooks() {
  localStorage.setItem('books', JSON.stringify(books));
}

// Render books to the DOM based on search and filter criteria
function renderBooks() {
  const searchText = searchInput.value.toLowerCase(); // Get search text
  const filter = filterStatus.value; // Get filter status
  bookList.innerHTML = ''; // Clear the book list

  // Filter and display books
  books
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchText) || book.author.toLowerCase().includes(searchText); // Check if book matches search
      const matchesStatus = filter === 'all' || book.status === filter; // Check if book matches filter
      return matchesSearch && matchesStatus;
    })
    .forEach((book, index) => {
      const li = document.createElement('li'); // Create list item for each book
      li.innerHTML = `
        <strong>${book.title}</strong> by ${book.author} — <em>${book.status}</em>
        ${book.cover ? `<br><img src="${book.cover}" alt="Cover" style="width:80px;height:auto;">` : ''}
        <br><button onclick="deleteBook(${index})">Delete</button>
      `;
      bookList.appendChild(li); // Append book to the list
    });
}

// Delete a book by index
function deleteBook(index) {
  books.splice(index, 1); // Remove book from array
  saveBooks(); // Save updated books array
  renderBooks(); // Re-render books
}

// Handle form submission to add a new book
bookForm.addEventListener('submit', e => {
  e.preventDefault(); // Prevent default form submission
  const newBook = {
    title: document.getElementById('title').value.trim(), // Get book title
    author: document.getElementById('author').value.trim(), // Get book author
    status: document.getElementById('status').value, // Get book status
    cover: document.getElementById('cover').value.trim() // Get book cover URL
  };
  books.push(newBook); // Add new book to array
  saveBooks(); // Save updated books array
  bookForm.reset(); // Reset the form
  renderBooks(); // Re-render books
});

// Add event listeners for search and filter inputs
searchInput.addEventListener('input', renderBooks); // Re-render books on search input
filterStatus.addEventListener('change', renderBooks); // Re-render books on filter change
importInput.addEventListener('change', handleImport); // Handle CSV import

// Start QR code scanner to fetch book data by ISBN
function startScanner() {
  const scanner = new Html5Qrcode("qr-reader"); // Initialize QR code scanner
  scanner.start(
    { facingMode: "environment" }, // Use environment-facing camera
    { fps: 10, qrbox: 250 }, // Set scanner options
    (decodedText, decodedResult) => {
      if (/^\d{10,13}$/.test(decodedText)) { // Check if decoded text is a valid ISBN
        scanner.stop(); // Stop the scanner
        fetchBookData(decodedText); // Fetch book data using ISBN
      }
    },
    error => {} // Handle errors (optional)
  );
}

// Fetch book data from Google Books API using ISBN
function fetchBookData(isbn) {
  fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`) // Make API request
    .then(res => res.json()) // Parse JSON response
    .then(data => {
      if (data.totalItems > 0) { // Check if book data is found
        const info = data.items[0].volumeInfo; // Get book info
        const book = {
          title: info.title || 'Unknown Title', // Get book title
          author: (info.authors && info.authors.join(', ')) || 'Unknown Author', // Get book authors
          status: 'unread', // Default status
          cover: info.imageLinks?.thumbnail || '' // Get book cover URL
        };
        books.push(book); // Add book to array
        saveBooks(); // Save updated books array
        renderBooks(); // Re-render books
        alert(`Added: ${book.title} by ${book.author}`); // Show success message
      } else {
        alert("Book not found in Google Books."); // Show error message if book not found
      }
    })
    .catch(err => {
      console.error(err); // Log error
      alert("Error fetching book data."); // Show error message
    });
}

// Export books to a CSV file
function exportToCSV() {
  let csv = "Title,Author,Status,Cover\n"; // Initialize CSV header
  books.forEach(book => {
    csv += `"${book.title}","${book.author}","${book.status}","${book.cover}"\n`; // Add book data to CSV
  });
  const blob = new Blob([csv], { type: "text/csv" }); // Create CSV file blob
  const url = URL.createObjectURL(blob); // Create URL for blob
  const a = document.createElement("a"); // Create anchor element
  a.href = url; // Set href to blob URL
  a.download = "books.csv"; // Set download filename
  a.click(); // Trigger download
  URL.revokeObjectURL(url); // Revoke blob URL
}

// Handle CSV import to add books
function handleImport(event) {
  const file = event.target.files[0]; // Get selected file
  if (!file) return; // Exit if no file selected

  Papa.parse(file, {
    header: true, // Parse CSV with headers
    complete: function(results) {
      results.data.forEach(row => {
        if (row.Title && row.Author) { // Check if row has required fields
          books.push({
            title: row.Title, // Get book title
            author: row.Author, // Get book author
            status: row.Status || 'unread', // Get book status or default
            cover: row.Cover || '' // Get book cover URL or default
          });
        }
      });
      saveBooks(); // Save updated books array
      renderBooks(); // Re-render books
    }
  });
}

// Check if user is logged in
function checkLogin() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    profileUsername.textContent = user.username;
    profileSection.style.display = 'block';
    loginForm.style.display = 'none';
  } else {
    profileSection.style.display = 'none';
    loginForm.style.display = 'block';
  }
}

// Handle login form submission
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (username && password) {
    const user = { username, password }; // In a real app, validate credentials on the server
    localStorage.setItem('user', JSON.stringify(user));
    checkLogin();
  } else {
    alert('Please enter both username and password.');
  }
});

// Handle logout
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('user');
  checkLogin();
});

// Initialize login state
checkLogin();

// Initial render of books
renderBooks();
