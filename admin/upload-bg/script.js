const firebaseConfig = {
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
let venuesCount = 0;

function uploadVenueFile() {
    let fileInput = document.getElementById("venueFile");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        console.error("No file selected.");
        return;
    }

    let file = fileInput.files[0];
    if (!file || !file.type || !file.type.match(/application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/)) {
        console.error("Invalid file selected. Please select an XLSX file.");
        return;
    }

    Swal.fire({
        title: 'Upload in Progress',
        text: 'Please wait while the file is being uploaded.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
            popup: 'text-white'
        }
    });

    let reader = new FileReader();
    reader.onload = function (e) {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, { type: 'array' });
        let worksheet = workbook.Sheets[workbook.SheetNames[0]];
        let rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        let addVenuePromises = [];
        for (let i = 0; i < rows.length; i++) {
            let columns = rows[i];
            addVenuePromises.push(addVenue(columns[0], columns[1],columns[2],columns[3]));
        }

        Promise.all(addVenuePromises).then(() => {
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'Brigade Data Added',
                text: `${venuesCount} brigades have been added successfully!`,
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'text-white'
                }
            });
        });
    };
    reader.readAsArrayBuffer(file);
}



function addVenue(bnameno, blname,blno,venue) {
    if (!bnameno) {
        console.error("Brigade details is empty.");
        return Promise.resolve();
    }

    return db.collection("brigades")
        .doc(bnameno)
        .set({
            bnameno,
            blname,
            blno,
            venue,
        })
        .then(() => {
            console.log("Brigade added successfully!");
            venuesCount++;
        })
        .catch((error) => {
            console.error("Error adding venue: ", error);
        });
}


