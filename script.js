const firebaseConfig = {
    apiKey: "AIzaSyC2783FKRWNzhXWvMj9lHPDGs5CpaZfaxc",
    authDomain: "cled-16ada.firebaseapp.com",
    projectId: "cled-16ada",
    storageBucket: "cled-16ada.appspot.com",
    messagingSenderId: "907231652143",
    appId: "1:907231652143:web:042d6cb9a645e7161819da",
  };
  
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const db = firebase.firestore();
  
  function find() {
    const rollNo = document.getElementById("rollno").value.trim();
    let rollno = String(rollNo);
  
    if (!rollno) {
      Swal.fire({
        icon: "warning",
        title: "Roll Number Required",
        text: "Please enter your roll number.",
        confirmButtonText: "OK",
        customClass: {
          popup: "text-white", 
        },
      });
      return;
    }
    Swal.fire({
      title: 'Loading',
      text: 'Please wait.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
          popup: 'text-white'
      }
  });
  
    db.collection("students")
      .where("stdroll", "==", rollno)
      .get()
      .then((studentSnapshot) => {
        if (studentSnapshot.empty) {
          Swal.close();
          Swal.fire({
            icon: "error",
            title: "Not Found",
            text: "No student found with this roll number.",
            confirmButtonText: "OK",
            customClass: {
              popup: "text-white",
            },
          });
          return;
        }
  
        let studentData;
        studentSnapshot.forEach((doc) => {
          studentData = doc.data();
        });
  
        if (!studentData || !studentData.stdbg) {
          Swal.close();
          Swal.fire({
            icon: "error",
            title: "Brigade Info Missing",
            text: "No brigade information available for this student.",
            confirmButtonText: "OK",
            customClass: {
              popup: "text-white",
            },
          });
          return;
        }
  
        db.collection("brigades")
          .where("bnameno", "==", studentData.stdbg)
          .get()
          .then((brigadeSnapshot) => {
            if (brigadeSnapshot.empty) {
              Swal.close();
              console.log(studentData.stdbg)
              Swal.fire({
                icon: "error",
                title: "Brigade Not Found",
                text: "No brigade found with this number.",
                confirmButtonText: "OK",
                customClass: {
                  popup: "text-white",
                },
              });
              return;
            }
  
            let brigadeData;
            brigadeSnapshot.forEach((doc) => {
              brigadeData = doc.data();
            });
  
            if (!brigadeData) {
              Swal.close();
              Swal.fire({
                icon: "error",
                title: "Brigade Info Missing",
                text: "No brigade details available.",
                confirmButtonText: "OK",
                customClass: {
                  popup: "text-white",
                },
              });
              return;
            }
            Swal.close();
            Swal.fire({
              icon: "info",
          title: "Your Brigade Details",
          html: `<p><strong>Name : </strong> ${studentData.stdname}</p>
                <p><strong>Temporary Roll no : </strong> ${studentData.stdroll}</p>
                <p><strong>Brigade no:</strong> ${brigadeData.bnameno}</p>
                <p><strong>Brigade Lead :</strong> ${brigadeData.blname}</p>
                <p><strong>Brigade Lead Mobile no:</strong> <a href="tel:${brigadeData.blno}" style="color: #00ff00;">${brigadeData.blno}</a></p>
                <p><strong>Brigade Venue:</strong> ${brigadeData.venue}</p>
                <p>For Venue clarification, please contact <a href="tel:8668113739" style="color: #00ff00;">8668113739</a>.</p>`,
              showConfirmButton: false,
              customClass: {
                popup: "text-white",
              },
            });
          });
      })
      .catch((error) => {
        console.error("Error fetching student or brigade data: ", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while fetching the data. Please try again later.",
          confirmButtonText: "OK",
          customClass: {
            popup: "text-white",
          },
        });
      });
  }
  