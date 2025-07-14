let books = JSON.parse(localStorage.getItem('books')) || [];

const bookForm = document.getElementById('book-form');
const bookList = document.getElementById('book-list');
const searchInput = document.getElementById('search');
const filterStatus = document.getElementById('filter-status');
const importInput = document.getElementById('import-csv');

function saveBooks() {
  localStorage.setItem('books', JSON.stringify(books));
}

function renderBooks() {
  const searchText = searchInput.value.toLowerCase();
  const filter = filterStatus.value;
  bookList.innerHTML = '';

  books
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchText) || book.author.toLowerCase().includes(searchText);
      const matchesStatus = filter === 'all' || book.status === filter;
      return matchesSearch && matchesStatus;
    })
    .forEach((book, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${book.title}</strong> by ${book.author} — <em>${book.status}</em>
        ${book.cover ? `<br><img src="${book.cover}" alt="Cover" style="width:80px;height:auto;">` : ''}
        <br><button onclick="deleteBook(${index})">Delete</button>
      `;
      bookList.appendChild(li);
    });
}

function deleteBook(index) {
  books.splice(index, 1);
  saveBooks();
  renderBooks();
}

bookForm.addEventListener('submit', e => {
  e.preventDefault();
  const newBook = {
    title: document.getElementById('title').value.trim(),
    author: document.getElementById('author').value.trim(),
    status: document.getElementById('status').value,
    cover: document.getElementById('cover').value.trim()
  };
  books.push(newBook);
  saveBooks();
  bookForm.reset();
  renderBooks();
});

searchInput.addEventListener('input', renderBooks);
filterStatus.addEventListener('change', renderBooks);
importInput.addEventListener('change', handleImport);

function startScanner() {
  const scanner = new Html5Qrcode("qr-reader");
  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText, decodedResult) => {
      if (/^\d{10,13}$/.test(decodedText)) {
        scanner.stop();
        fetchBookData(decodedText);
      }
    },
    error => {}
  );
}

function fetchBookData(isbn) {
  fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
    .then(res => res.json())
    .then(data => {
      if (data.totalItems > 0) {
        const info = data.items[0].volumeInfo;
        const book = {
          title: info.title || 'Unknown Title',
          author: (info.authors && info.authors.join(', ')) || 'Unknown Author',
          status: 'unread',
          cover: info.imageLinks?.thumbnail || ''
        };
        books.push(book);
        saveBooks();
        renderBooks();
        alert(`Added: ${book.title} by ${book.author}`);
      } else {
        alert("Book not found in Google Books.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error fetching book data.");
    });
}

function exportToCSV() {
  let csv = "Title,Author,Status,Cover\n";
  books.forEach(book => {
    csv += `"${book.title}","${book.author}","${book.status}","${book.cover}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "books.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    complete: function(results) {
      results.data.forEach(row => {
        if (row.Title && row.Author) {
          books.push({
            title: row.Title,
            author: row.Author,
            status: row.Status || 'unread',
            cover: row.Cover || ''
          });
        }
      });
      saveBooks();
      renderBooks();
    }
  });
}

renderBooks();
