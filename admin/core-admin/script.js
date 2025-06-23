var firebaseConfig = {
  apiKey: "AIzaSyC2783FKRWNzhXWvMj9lHPDGs5CpaZfaxc",
  authDomain: "cled-16ada.firebaseapp.com",
  projectId: "cled-16ada",
  storageBucket: "cled-16ada.appspot.com",
  messagingSenderId: "907231652143",
  appId: "1:907231652143:web:042d6cb9a645e7161819da"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

function deleteData() {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Deletion in Progress',
        text: 'Please wait....',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
            popup: 'text-white'
        }
    });

      const venuesRef = db.collection('brigades');
      const studentsRef = db.collection('students');

      let venuesDeleted = 0;
      let studentsDeleted = 0;
      let venuesCount = 0;
      let studentsCount = 0;

      venuesRef.get().then((querySnapshot) => {
        venuesCount = querySnapshot.size;
        querySnapshot.forEach((doc) => {
          doc.ref.delete().then(() => {
            console.log("Venue deleted successfully:", doc.id);
            venuesDeleted++;
            if (venuesDeleted === venuesCount) {
              checkCompletion();
            }
          }).catch((error) => {
            console.error("Error deleting venue document:", error);
          });
        });
      }).catch((error) => {
        console.error("Error getting venues collection:", error);
      });

      studentsRef.get().then((querySnapshot) => {
        studentsCount = querySnapshot.size;
        querySnapshot.forEach((doc) => {
          doc.ref.delete().then(() => {
            console.log("Student deleted successfully:", doc.id);
            studentsDeleted++;
            if (studentsDeleted === studentsCount) {
              checkCompletion();
            }
          }).catch((error) => {
            console.error("Error deleting student document:", error);
          });
        });
      }).catch((error) => {
        console.error("Error getting students collection:", error);
      });

      function checkCompletion() {
        if (venuesDeleted === venuesCount && studentsDeleted === studentsCount) {
          Swal.fire({
            icon: 'success',
            title: 'Data Deletion Success',
            html: '<p style="color: white;">All data has been deleted from the database.</p>',
            customClass: {
              content: 'text-white',
            },
            didClose: () => {
              window.location.reload();
            }
          });
        }
      }
    }
  });
}

function loadTableData() {
  const venuesRef = db.collection('brigades');
  const studentsRef = db.collection('students');

  const venuesTableBody = document.querySelector('#venuesTable tbody');
  const studentsTableBody = document.querySelector('#studentsTable tbody');

  venuesRef.get().then((querySnapshot) => {
    const venuesCount = querySnapshot.size;
    document.getElementById('venuesCount').textContent = `(${venuesCount})`;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `<td>${data.bnameno}</td><td>${data.blname}</td><td>${data.blno}</td><td>${data.venue}</td>`;
      venuesTableBody.appendChild(row);
    });
  }).catch((error) => {
    console.error("Error getting venues collection:", error);
  });

  studentsRef.get().then((querySnapshot) => {
    const studentsCount = querySnapshot.size;
    document.getElementById('studentsCount').textContent = `(${studentsCount})`;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `<td>${data.stdroll}</td><td>${data.stdname}</td><td>${data.stdbg}</td>`;
      studentsTableBody.appendChild(row);
    });
  }).catch((error) => {
    console.error("Error getting students collection:", error);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  loadTableData();
});
