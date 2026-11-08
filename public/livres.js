/* ==============================================================
 * livres.js rend le bouton FAB fonctionnel. 
 * Au clic : ouvre un dialogue avec formulaire. 
 * À l'envoi : crée une nouvelle carte et l'ajoute à la liste.
 * ============================================================== */

// --- Références aux éléments du DOM --- 
const fab           = document.querySelector('.fab');
const dialogue      = document.querySelector('#dialogue-livre');
const form          = document.querySelector('#form-livre');
const boutonAnnuler = document.querySelector('#annuler');
const liste         = document.querySelector('main ul');

// --- Ouvrir le dialogue au clic sur le FAB --- 
fab.addEventListener('click', () => {
    dialogue.showModal();
});

// --- Bouton "Annuler" : ferme sans rien créer --- 
boutonAnnuler.addEventListener('click', () => {
    dialogue.close();
});

// --- Déclenchement à chaque fermeture, peu importe la cause
dialogue.addEventListener('close', () => {
    form.reset();
})

// --- Traiter l'envoi du formulaire --- 
form.addEventListener('submit', (e) => {
    // Empêche de recharger la page (comportement par défaut d'un formulaire)
    e.preventDefault();

    // Lire les valeurs saisies
    // .trim() enlève les espaces superflus 
    const titre  = form.titre.value.trim();
    const auteur = form.auteur.value.trim();
    const lien   = form.lien.value.trim();
    const isbn   = form.isbn.value.replace(/\D/g, '');

    // Création de la carte et ajout au bas de la liste
    liste.append(creerCarte(titre, auteur, lien, isbn));

    // Fermeture de la boite de dialogue 
    dialogue.close();
});

/** 
 * Construit une carte-livre identique à celle incluse dans le HTML 
 */ 
function creerCarte(titre, auteur, lien, isbn) {
    const li = document.createElement('li');
    li.className = 'carte';

    const a = document.createElement('a');
    a.href   = lien; 
    a.target = '_blank';
    a.rel    = 'noopener';

    // Création de l'URL à partir du ISBN
    const img = document.createElement('img'); 
    img.src = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
    img.alt = `Couverture de ${titre}`;

    // Afficher une erreur si Open Library n'a pas la couverture
    img.addEventListener('error', () => {
        console.log('Couverture introuvable - ISBN:', isbn, '→', img.src);
        img.remove();
    });

    const div = document.createElement('div');

    const h2 = document.createElement('h2');
    h2.textContent = titre;

    const p = document.createElement('p');
    p.textContent = auteur;

    div.append(h2, p);
    a.append(img, div);
    li.append(a);

    return li;
}