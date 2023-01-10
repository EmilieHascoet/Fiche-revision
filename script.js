// Crée des constantes
const main = document.querySelector('main');
const moreNoteCard = document.getElementById('moreNoteCard')
const lastCard = moreNoteCard.parentNode
let checkboxes = document.querySelectorAll('[class~=form-child] input')
let forms, db, cardNumber = 0, nbCard = 0;

// Update la base donnée à chaque fois qu'une case est cochée
// checkboxes.forEach(checkbox => {
//     checkbox.addEventListener('click', updateDB)
// })

const openRequest = window.indexedDB.open('card_db', 1);

openRequest.addEventListener('error', () => console.error('Database failed to open'));

openRequest.addEventListener('success', () => {
  console.log('Database opened succesfully');

  db = openRequest.result;

  displayCard();
});


openRequest.addEventListener('upgradeneeded', e => {

    db = e.target.result;
  
    // Crée la table checkboxes qui va contenir les informations des themes des matières et leur intitulé
    const objectStore = db.createObjectStore('checkboxes', { keyPath: 'id', autoIncrement:true });
    
    objectStore.createIndex('content', 'content', { unique: false });
    objectStore.createIndex('formID', 'formID', { unique: false });
    objectStore.createIndex('formChild', 'formChild', { unique: false });
    objectStore.createIndex('checked', 'checked', { unique: false });
    
    // Crée la table subjects qui va contenir les informations des matières et leur noms
    const objectStore2 = db.createObjectStore('subjects', { keyPath: 'id', autoIncrement:true });
  
    objectStore2.createIndex('name', 'name', { unique: false });

    console.log('Database setup complete');
  });


// Ajoute une fonction à mon image pour ajouter une note card
moreNoteCard.addEventListener('click', addCard);

function addCard() {
    const form = document.createElement('form');

    const inputTitre = document.createElement('input');
    const div1 = document.createElement('div');
    const titre1 = document.createElement('h3')
    const div2 = document.createElement('div');
    const titre2 = document.createElement('h3')

    const fieldset = document.createElement('fieldset');

    div1.appendChild(titre1)
    div2.appendChild(titre2)

    const fieldsetChild = 
        `<legend>Add items</legend>
        <label for="chapitre">Ajout chapitre :</label><br>
        <input type="text" id="chapitre"><br>

        <label for="demonstration">Ajout demonstration :</label><br>
        <input type="text" id="demonstration"><br>
        <button>Add</button>`;

    fieldset.innerHTML = fieldsetChild;

    form.appendChild(inputTitre);
    form.appendChild(div1);
    form.appendChild(div2);
    form.appendChild(fieldset);

    titre1.textContent = "Les chapitres"
    titre2.textContent = "Les démonstration"

    // configure l'id du formulaire, à chaque nouvelle card il s'incrémente de 1
    form.setAttribute('data-number', `${cardNumber}`);
    cardNumber++
    form.setAttribute('autocomplete', "off");
    inputTitre.setAttribute('id', "titre")
    inputTitre.setAttribute('type', "texte")
    inputTitre.setAttribute('placeholder', "Nom de la matière");
    div1.setAttribute('class', `form-child-chapitre`);
    div2.setAttribute('class', `form-child-demonstration`);

    // Insert la nouvelle card avant la card qui permet d'ajouter de nouvelle card
    main.insertBefore(form, lastCard);

    // Après avoir rajouté un formulaire, actualiser la liste forms 
    forms = document.querySelectorAll('form');
    // Crée l'event 'submit' à tous les formulaire, pour que quand le formulaire est remit la fonction addData() se lance
    forms.forEach(form => {
        form.addEventListener('submit', addData);
    });
}

// Ajoute des données à la BD
function addData(e) {

    e.preventDefault();

    // Récupère le formulaire où ont été entré les données, puis le numéro de card
    const form = e.target;
    const formId = form.getAttribute("data-number");
    
    // Récupère les données entrées par l'utilisateur
    const newChapitre = form.elements['chapitre'].value
    const newDemo = form.elements['demonstration'].value

    const transaction = db.transaction(['checkboxes'], 'readwrite');
    const objectStore = transaction.objectStore('checkboxes');
    
    // insére l'element de type chapitre dans la DB, si il y en a un
    if (newChapitre != "") {
        
        const newItem = { content: newChapitre, formID: formId, formChild: 1, checked: 0 };
        
        const addRequest = objectStore.add(newItem);
        
        addRequest.addEventListener('success', () => {
            // vide les input de type texte du formulaire
            form.reset()
        });
    }
    
    // insére l'element de type demo dans la DB, si il y en a un
    if (newDemo != "") {
        const newItem = { content: newDemo ,formID: formId, formChild: 2, checked: 0 };
        
        const addRequest = objectStore.add(newItem);
        
        addRequest.addEventListener('success', () => {
            // vide les input de type texte du formulaire
            form.reset()
        });
    }

    transaction.addEventListener('complete', () => {
        console.log('Transaction completed: database modification finished.');

        // display les données de la card sur laquelle on a ajouté des données
        displayData(formId);
    });

    transaction.addEventListener('error', () => console.log('Transaction not opened due to error'));
}

function displayCard() {
    
    const objectStore = db.transaction('checkboxes').objectStore('checkboxes');
    objectStore.openCursor().onsuccess = function (e) {
        const cursor = e.target.result;

        // Cherche le nombre de card à afficher (= formID le plus élevé, parmis toutes les données de checkboxes)
        if(cursor) {
            nbCard = nbCard > cursor.value.formID ? nbCard : cursor.value.formID
            cursor.continue();
        } 
        else {
            // Ajoute une card à l'HTML et affiche les données de la card
            for(let i = 0; i <= nbCard; i++) {
                addCard();
                displayData(i);
            }
        }
    }
}


function displayData(i) {
    const form = forms[i];

    // Supprime les données de la card, pour ne pas dupliquer les données au niveau de l'affichage
    while (form.children[1].children[1]) {
        form.children[1].removeChild(form.children[1].children[1]);
    }

    while (form.children[2].children[1]) {
        form.children[2].removeChild(form.children[2].children[1]);
    }
    
    db.transaction('checkboxes', "readonly").objectStore('checkboxes').openCursor().onsuccess = function (e) {
        const cursor = e.target.result;

        // Affiche les données dans la card i
        if(cursor) {
            if (cursor.value.formID == i) {
                const chapitreInput = `<input type="checkbox" id="${cursor.value.id}"></input>`;
                const chapitreLabel = `<label for="${cursor.value.id}"> ${cursor.value.content}</label><br>`;
    
                form.children[cursor.value.formChild].insertAdjacentHTML("beforeend", chapitreInput);
                form.children[cursor.value.formChild].insertAdjacentHTML("beforeend", chapitreLabel);

                // Ajoute un boutton suppr, pour supprimer l'objet de la BD
            }
            // réitère pour le prochain objet dans le cursor
            cursor.continue();
        }
        else {
            console.log('Notes all displayed');
        }
    }
}