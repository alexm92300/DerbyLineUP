// Données globales
let roster = JSON.parse(localStorage.getItem('roster')) || [];
let stats = JSON.parse(localStorage.getItem('stats')) || {};
let lignes = JSON.parse(localStorage.getItem('lignes')) || [];

let ligneActuelleIndex = 0;
let joueusesEnPrison = [];
let bloqueusesEnPrisonOrdre = [];
let joueusesEnPause = {};
let prochaineLigneTableau = null;
let compteurJams = parseInt(localStorage.getItem('compteurJams')) || 1;

let boutonsPause = {};
let boutonsEtat = {};

const navLinks = document.querySelectorAll('nav a');
	navLinks.forEach(link => {
		if (link.href === window.location.href) {
			link.classList.add('active');
		}
});

// Fonctions de gestion des états des boutons
	function mettreAJourAffichageBouton(nomBouton) {
		let bouton = document.getElementById(nomBouton);
		let etat = boutonsEtat[nomBouton];
		if (bouton && etat) {
			bouton.textContent = etat.statut;
			bouton.style.display = etat.visible ? 'inline-block' : 'none';
			bouton.className = etat.style;
		}
	}

	function mettreAJourEtatBouton(nomBouton, statut, visible, style) {
		boutonsEtat[nomBouton] = {
			statut: statut,
			visible: visible,
			style: style
		};
		mettreAJourAffichageBouton(nomBouton);
	}

	function sauvegarderEtatBoutons() {
		localStorage.setItem('boutonsEtat', JSON.stringify(boutonsEtat));
	}

	function initialiserBoutons() {
		let etatSauvegarde = localStorage.getItem('boutonsEtat');
		if (etatSauvegarde) {
			boutonsEtat = JSON.parse(etatSauvegarde);
		} else {
			// Initialiser les boutons avec des valeurs par défaut
			// ...
		}
		// Mettre à jour l'affichage de tous les boutons
		for (let nomBouton in boutonsEtat) {
			mettreAJourAffichageBouton(nomBouton);
		}
	}

// Fonctions de gestion du Roster (Roster.html)
const RosterManager = {
    initialiser: function() {
		console.log("RosterManager.initialiser() appelé"); // Ajouter ce log
        const table = document.getElementById('rosterTable').getElementsByTagName('tbody')[0];
        if (table) {
            table.innerHTML = '';
            roster.forEach(joueuse => {
                let row = table.insertRow();
                row.draggable = true; // Rendre la ligne déplaçable
                row.addEventListener('dragstart', this.dragStart.bind(this));
                row.addEventListener('dragover', this.dragOver.bind(this));
                row.addEventListener('drop', this.drop.bind(this));
                let nomCell = row.insertCell(0);
                let numeroCell = row.insertCell(1);
                let jammerCell = row.insertCell(2);
                let pivotCell = row.insertCell(3);
                let blockerCell = row.insertCell(4);
                let actionsCell = row.insertCell(5);

                // Nom éditable
                nomCell.textContent = joueuse.nom;
                nomCell.contentEditable = "true";
                nomCell.addEventListener('blur', (event) => this.modifierNom(joueuse.nom, event.target.textContent));

                // Numéro éditable
                numeroCell.textContent = joueuse.numero;
                numeroCell.contentEditable = "true";
                numeroCell.addEventListener('blur', (event) => this.modifierNumero(joueuse.nom, event.target.textContent));

                // Affichage de "X" ou rien pour les postes
                jammerCell.textContent = joueuse.jammer ? 'X' : '';
                pivotCell.textContent = joueuse.pivot ? 'X' : '';
                blockerCell.textContent = joueuse.blocker ? 'X' : '';

                // Gestionnaires d'événements pour basculer les postes
                jammerCell.addEventListener('click', () => this.togglePoste(joueuse.nom, 'jammer'));
                pivotCell.addEventListener('click', () => this.togglePoste(joueuse.nom, 'pivot'));
                blockerCell.addEventListener('click', () => this.togglePoste(joueuse.nom, 'blocker'));

                // Supprimer le bouton "Modifier"
                let supprimerBtn = document.createElement('button');
                supprimerBtn.textContent = 'Supprimer';
                supprimerBtn.onclick = () => this.supprimer(joueuse.nom);

                actionsCell.appendChild(supprimerBtn);;
            });
        } else {
            console.error("L'élément avec l'ID 'rosterTable' n'a pas été trouvé dans RosterManager.initialiser.");
        }

		// Gestionnaire d'événements pour le bouton "Ajouter"
        const ajouterNouvelleJoueuseButton = document.getElementById('ajouterNouvelleJoueuse');
        if (ajouterNouvelleJoueuseButton) {
            ajouterNouvelleJoueuseButton.addEventListener('click', this.ajouter.bind(this));
        } else {
            console.error("L'élément avec l'ID 'ajouterNouvelleJoueuse' n'a pas été trouvé dans RosterManager.initialiser.");
        }

        // Gestionnaire d'événements pour le bouton "Importer"
        const importerRosterButton = document.getElementById('importerRoster');
        if (importerRosterButton) {
            importerRosterButton.addEventListener('click', this.importer.bind(this));
        } else {
            console.error("L'élément avec l'ID 'importerRoster' n'a pas été trouvé dans RosterManager.initialiser.");
        }

        // Gestionnaire d'événements pour le bouton "Sauvegarder"
        const sauvegarderRosterButton = document.getElementById('sauvegarderRoster');
        if (sauvegarderRosterButton) {
            sauvegarderRosterButton.addEventListener('click', this.sauvegarder.bind(this));
        } else {
            console.error("L'élément avec l'ID 'sauvegarderRoster' n'a pas été trouvé dans RosterManager.initialiser.");
        }
    },
	
    modifierNom: function(nomActuel, nouveauNom) {
        let joueuse = roster.find(j => j.nom === nomActuel);
        if (joueuse) {
            joueuse.nom = nouveauNom;
            this.sauvegarder();
        }
    },
	
	modifierNumero: function(nom, nouveauNumero) {
        let joueuse = roster.find(j => j.nom === nom);
        if (joueuse) {
            joueuse.numero = nouveauNumero;
            this.sauvegarder();
        }
    },
	
    togglePoste: function(nom, poste) {
        let joueuse = roster.find(j => j.nom === nom);
        if (joueuse) {
            joueuse[poste] = !joueuse[poste]; // Basculer l'état
            this.sauvegarder();
            this.initialiser(); // Recharger le tableau pour afficher les changements
        }
    },
	
    importer: function() {
        document.getElementById('importArea').style.display = 'block';

        const importerDepuisTexteButton = document.getElementById('importerDepuisTexte');
        if (importerDepuisTexteButton) {
            importerDepuisTexteButton.addEventListener('click', this.importerDepuisTexte.bind(this));
        } else {
            console.error("L'élément avec l'ID 'importerDepuisTexte' n'a pas été trouvé dans RosterManager.importer.");
        }
    },
	
    importerDepuisTexte: function() {
        const data = document.getElementById('importData').value;
        const lignes = data.split('\n'); // Séparer les lignes par les sauts de ligne

        roster = lignes.map(ligne => {
            const champs = ligne.split('\t'); // Séparer les champs par les tabulations
            const nom = champs[0];
            const numero = champs[1];
            const postes = champs[2];

            const jammer = postes.includes('J');
            const pivot = postes.includes('P');
            const blocker = postes.includes('B');

            return { nom: nom, numero: numero, jammer: jammer, pivot: pivot, blocker: blocker };
        });

        this.sauvegarder();
        this.initialiser();
        document.getElementById('importArea').style.display = 'none';
    },

	
    ajouter: function() {
        const nom = document.getElementById('nouveauNom').value;
        const numero = document.getElementById('nouveauNumero').value;

        if (nom && numero) {
            roster.push({ nom: nom, numero: numero, jammer: false, pivot: false, blocker: false });
            this.sauvegarder();
            this.initialiser();

            // Effacer les champs de saisie
            document.getElementById('nouveauNom').value = '';
            document.getElementById('nouveauNumero').value = '';
        }
    },
	
    supprimer: function(nom) {
        roster = roster.filter(joueuse => joueuse.nom !== nom);
        this.sauvegarder();
        this.initialiser();
    },
	
    sauvegarder: function() {
        localStorage.setItem('roster', JSON.stringify(roster));
    },
	
	dragStart: function(event) {
        event.dataTransfer.setData('text/plain', event.target.rowIndex - 1); // Stocker l'index de la ligne
    },

    dragOver: function(event) {
        event.preventDefault(); // Autoriser le drop
    },

	drop: function(event) {
		event.preventDefault();
		const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
		const targetRow = event.target.closest('tr'); // Trouver la ligne parente

		if (targetRow) {
			const toIndex = targetRow.rowIndex - 1;

			if (fromIndex !== toIndex) {
				const joueuseDeplacee = roster.splice(fromIndex, 1)[0];
				roster.splice(toIndex, 0, joueuseDeplacee);

				this.sauvegarder();
				this.initialiser();
			}
		} else {
			console.error("La ligne cible n'a pas été trouvée.");
		}
	},
};

// Fonctions de gestion des Lignes (lignes.html)
const LignesManager = {
    initialiser: function() {
        console.log("LignesManager.initialiser() appelé");
		this.mettreAJour();

		const ajouterLigneButton = document.getElementById('ajouterLigne');
		if (ajouterLigneButton) {
			ajouterLigneButton.addEventListener('click', this.ajouterLigne.bind(this));
		} else {
			console.error("L'élément avec l'ID 'ajouterLigne' n'a pas été trouvé dans LignesManager.initialiser.");
		}

		const sauvegarderLignesButton = document.getElementById('sauvegarderLignes');
		if (sauvegarderLignesButton) {
			sauvegarderLignesButton.addEventListener('click', this.sauvegarder.bind(this));
		} else {
			console.error("L'élément avec l'ID 'sauvegarderLignes' n'a pas été trouvé dans LignesManager.initialiser.");
		}
    },
	mettreAJour: function() {
		const table = document.getElementById('lignesTable').getElementsByTagName('tbody')[0];
		if (table) {
			table.innerHTML = '';
			lignes.forEach((ligne, index) => {
				let row = table.insertRow();
				row.draggable = true;
                row.dataset.index = index; // Attribution de data-index
                row.addEventListener('dragstart', this.dragStart.bind(this));
                row.addEventListener('dragover', this.dragOver.bind(this));
                row.addEventListener('drop', this.drop.bind(this));
				let numeroCell = row.insertCell(0); // Ajout de la cellule du numéro de ligne
				numeroCell.textContent = index + 1; // Attribution du numéro de ligne

				['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'].forEach((poste, posteIndex) => {
					let cell = row.insertCell(posteIndex + 1); // Décalage des cellules de poste
					cell.setAttribute('data-index', index);
					cell.setAttribute('data-poste', poste);
					cell.setAttribute('ondrop', 'drop(event)');
					cell.setAttribute('ondragover', 'allowDrop(event)');

					let select = this.creerListeDeroulante(roster, ligne[poste], poste);
					select.onchange = (event) => this.mettreAJourLigne(index, poste, event.target.value);
					cell.appendChild(select);
				});

				let deleteBtn = document.createElement('button');
				deleteBtn.textContent = 'Supprimer';
				deleteBtn.onclick = () => this.supprimer(index);
				row.insertCell(6).appendChild(deleteBtn); // Décalage de la cellule du bouton Supprimer
			});
		} else {
			console.error("L'élément avec l'ID 'lignesTable' n'a pas été trouvé dans LignesManager.mettreAJour.");
		}
	},
    creerListeDeroulante: function(joueuses, nomSelectionne, poste) {
        let select = document.createElement('select');
        if (joueuses && joueuses.length > 0) {
            joueuses.forEach(joueuse => {
                if (poste === 'jammer' && joueuse.jammer ||
                    poste === 'pivot' && joueuse.pivot ||
                    poste.startsWith('blocker') && joueuse.blocker) {

                    let option = document.createElement('option');
                    option.value = joueuse.nom;
                    option.text = joueuse.nom;
                    if (joueuse.nom === nomSelectionne) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            });
        }
        return select;
    },
    mettreAJourLigne: function(index, poste, nom) {
        lignes[index][poste] = nom;
        this.sauvegarder();
    },
    ajouterLigne: function() {
        let nouvelleLigne = { jammer: '', pivot: '', blocker0: '', blocker1: '', blocker2: '' };
        lignes.push(nouvelleLigne);
        this.mettreAJour();
        this.sauvegarder();
    },
    supprimer: function(index) {
        lignes.splice(index, 1);
        this.mettreAJour();
        this.sauvegarder();
    },
    sauvegarder: function() {
        localStorage.setItem('lignes', JSON.stringify(lignes));
    },
	
	dragStart: function(event) {
        event.dataTransfer.setData("text/plain", event.target.dataset.index); // Utilisation de data-index
    },

    dragOver: function(event) {
        event.preventDefault();
    },

    drop: function(event) {
        event.preventDefault();
        const fromIndex = parseInt(event.dataTransfer.getData("text/plain"));
        const toIndex = parseInt(event.target.parentElement.dataset.index); // Utilisation de data-index

        if (fromIndex === toIndex) return;

        // Échange des lignes
        [lignes[fromIndex], lignes[toIndex]] = [lignes[toIndex], lignes[fromIndex]];

        this.mettreAJour();
        this.sauvegarder();
    },
};

// Fonctions de gestion du Jeu (jeu.html)
const JeuManager = {
	gererPrison : function(nom) {
		console.log(`JeuManager.gererPrison() appelé avec nom: ${nom}`);

		if (joueusesEnPrison.includes(nom)) {
			joueusesEnPrison = joueusesEnPrison.filter(joueuse => joueuse !== nom);

			// Mise à jour des boutons Pause pour Jammer et Pivot
			if (lignes[ligneActuelleIndex].jammer === nom || lignes[ligneActuelleIndex].pivot === nom) {
				const poste = lignes[ligneActuelleIndex].jammer === nom ? 'jammer' : 'pivot';
				const prochaineLigne = lignes[(ligneActuelleIndex + 1) % lignes.length];
				const nomPause = prochaineLigne[poste];
				const boutonId = poste;

				if (joueusesEnPause[boutonId] === nomPause) {
					delete joueusesEnPause[boutonId];
					if (stats[nomPause]) {
						stats[nomPause].pauses--;
					}
				}
			}

			// Mise à jour des boutons Pause pour les bloqueuses
			const postesBloqueuses = ['blocker0', 'blocker1', 'blocker2'];
			postesBloqueuses.forEach(poste => {
				if (lignes[ligneActuelleIndex][poste] === nom) {
					const prochaineLigne = lignes[(ligneActuelleIndex + 1) % lignes.length];
					postesBloqueuses.forEach((prochainPoste, index) => {
						const nomPause = prochaineLigne[prochainPoste];
						const boutonId = `${prochainPoste}-0`;

						if (joueusesEnPause[boutonId] === nomPause) {
							delete joueusesEnPause[boutonId];
							if (stats[nomPause]) {
								stats[nomPause].pauses--;
							}
						}
					});
				}
			});
		} else {
			joueusesEnPrison.push(nom);

			// Incrémentation des fautes et prisons
			if (!stats[nom]) {
				stats[nom] = { fautes: 0, prisons: 0, pauses: 0 };
			}
			stats[nom].prisons++;
			stats[nom].fautes++;
		}

		localStorage.setItem('stats', JSON.stringify(stats));
		JeuManager.afficher();
		JeuManager.creerEtAfficherProchaineLigne();
	},
	gererPause: function(poste, event) {
		console.log(`JeuManager.gererPause() appelé avec poste: ${poste}`)

		const nomPrison = lignes[ligneActuelleIndex][poste]
		const nomPause = lignes[(ligneActuelleIndex + 1) % lignes.length][poste]
		const boutonId = event.target.dataset.id

		if (joueusesEnPause[boutonId] === nomPause) {
			delete joueusesEnPause[boutonId]
			event.target.className = ''
			event.target.textContent = `Pause (${nomPrison})`
			if (stats[nomPause]) {
				stats[nomPause].pauses--
			}
		} else {
			// Transfert de pause si une autre joueuse est déjà en pause
			const posteBloqueuses = ['blocker0', 'blocker1', 'blocker2']
			posteBloqueuses.forEach(prochainPoste => {
				const prochainBoutonId = `${prochainPoste}-${boutonId.split('-')[1]}`
				if (joueusesEnPause[prochainBoutonId] === lignes[(ligneActuelleIndex + 1) % lignes.length][prochainPoste]) {
					delete joueusesEnPause[prochainBoutonId]
					document.querySelector(`button[data-id="${prochainBoutonId}"]`).className = ''
					document.querySelector(`button[data-id="${prochainBoutonId}"]`).textContent = `Pause (${lignes[ligneActuelleIndex][prochainPoste]})`
					if (stats[lignes[(ligneActuelleIndex + 1) % lignes.length][prochainPoste]]) {
						stats[lignes[(ligneActuelleIndex + 1) % lignes.length][prochainPoste]].pauses--
					}
				}
			})

			joueusesEnPause[boutonId] = nomPause
			event.target.className = 'pause-active'
			event.target.textContent = `Retour (${nomPrison})`
			if (!stats[nomPause]) {
				stats[nomPause] = { fautes: 0, prisons: 0, pauses: 0 }
			}
			stats[nomPause].pauses++
		}

		localStorage.setItem('stats', JSON.stringify(stats))
		JeuManager.afficher()
		JeuManager.creerEtAfficherProchaineLigne()
	},
	afficher: function() {
		console.log("JeuManager.afficher() appelé"); // Ajouter ce log

		JeuManager.afficherJoueusesEnJeu();
		//JeuManager.creerEtAfficherProchaineLigne();
		//JeuManager.initialiserBoutonsPause();
	},
	afficherJoueusesEnJeu: function() {
		const titreEnJeu = document.querySelector('#joueusesEnJeu h1'); // Sélectionner la balise <h1>

		if (titreEnJeu) { // Vérifier si l'élément existe
			titreEnJeu.textContent = `En Jeu - Jam ${compteurJams}`; // Modifier le contenu de la balise <h1>
		} else {
			console.error("La balise h1 n'a pas été trouvée dans #joueusesEnJeu");
		}

		const joueusesEnJeuDiv = document.getElementById('joueusesEnJeu');
		// Supprimer le contenu existant du div, en gardant le titre h1
		const table = joueusesEnJeuDiv.querySelector('table');
		if (table) {
			joueusesEnJeuDiv.removeChild(table);
		}

		if (lignes.length > 0) {
			const ligneActuelle = lignes[ligneActuelleIndex];
			const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];

			let tableHTML = '<table style="table-layout: fixed;"><thead><tr>';
			tableHTML += '<th>JAMMER</th><th>PIVOT</th><th>BLOCKER 1</th><th>BLOCKER 2</th><th>BLOCKER 3</th>';
			tableHTML += '</tr></thead><tbody>';

			let rowClass = '';
			const nbFautes = {};

			postesOrdre.forEach(poste => {
				const joueuse = ligneActuelle[poste];
				if (stats[joueuse]) {
					nbFautes[joueuse] = stats[joueuse].fautes;
				} else {
					nbFautes[joueuse] = 0;
				}
			});

			postesOrdre.forEach(poste => {
				const joueuse = ligneActuelle[poste];
				if (nbFautes[joueuse] >= 6) {
					rowClass = 'six-faults';
				}
			});

			tableHTML += `<tr class="${rowClass}">`;

			postesOrdre.forEach(poste => {
				const joueuse = ligneActuelle[poste];
				const estEnPrison = joueusesEnPrison.includes(joueuse);
				let prisonButton = `<button class="${estEnPrison ? 'green' : ''}" onclick="JeuManager.gererPrison('${joueuse.replace(/'/g, "\\'")}')">${estEnPrison ? 'Libérer' : 'Prison'}</button>`;

				const joueuseRoster = roster.find(r => r.nom === joueuse);
				const numero = joueuseRoster ? `#${joueuseRoster.numero}` : '';
				const fautes = nbFautes[joueuse];

				let cellClass = estEnPrison ? 'en-prison' : '';
				tableHTML += `<td class="${cellClass}" style="text-align: center;">${joueuse ? `${joueuse} ${numero}<br><span class="stats">(Fautes: ${fautes})</span><br>${prisonButton}` : ''}</td>`;
			});

			tableHTML += '</tr></tbody></table>';
			joueusesEnJeuDiv.innerHTML += tableHTML;
		}
	},
creerEtAfficherProchaineLigne: function() {
		console.log("JeuManager.creerEtAfficherProchaineLigne() appelé");

		const prochaineLigneDiv = document.getElementById('prochaineLigne');
		const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];
		const prochaineLigne = lignes[(ligneActuelleIndex + 1) % lignes.length];

		// Créer le tableau HTML
		let tableHTML = document.createElement('table');
		tableHTML.style.tableLayout = 'fixed';
		let thead = document.createElement('thead');
		let tr = document.createElement('tr');
		['JAMMER', 'PIVOT', 'BLOCKER 1', 'BLOCKER 2', 'BLOCKER 3'].forEach(titre => {
			let th = document.createElement('th');
			th.textContent = titre;
			tr.appendChild(th);
		});
		thead.appendChild(tr);
		tableHTML.appendChild(thead);
		let tbody = document.createElement('tbody');
		tr = document.createElement('tr');

		postesOrdre.forEach(poste => {
			const joueuse = prochaineLigne[poste];
			const joueuseRoster = roster.find(r => r.nom === joueuse);
			const numero = joueuseRoster ? `#${joueuseRoster.numero}` : '';
			const nbFautes = stats[joueuse] ? `(Fautes: ${stats[joueuse].fautes})` : '(Fautes: 0)';
			const nbPauses = stats[joueuse] ? `(Pauses: ${stats[joueuse].pauses})` : '(Pauses: 0)';

			let td = document.createElement('td');
			td.dataset.poste = poste;
			td.style.textAlign = 'center';
			td.style.verticalAlign = 'top';
			td.innerHTML = joueuse ? `${joueuse} ${numero}<br><span class="stats">${nbFautes}</span><span class="stats">${nbPauses}</span>` : '';

			// Créer les boutons "Pause/Retour"
			let nomPrison = lignes[ligneActuelleIndex][poste];
			let nomPause = lignes[(ligneActuelleIndex + 1) % lignes.length][poste];

			if (poste.startsWith('blocker')) {
				for (let i = 0; i < 3; i++) {
					let nouveauBouton = document.createElement('button');
					nouveauBouton.onclick = function(event) {
						JeuManager.gererPause(poste, event);
					};
					nouveauBouton.dataset.id = `${poste}-${i}`;
					if (joueusesEnPause[nouveauBouton.dataset.id] === nomPause) {
						nouveauBouton.className = 'pause-active';
						nouveauBouton.textContent = `Retour (${lignes[ligneActuelleIndex]['blocker' + i]})`;
					} else {
						nouveauBouton.className = 'pause-hidden';
						nouveauBouton.textContent = `Pause (${lignes[ligneActuelleIndex]['blocker' + i]})`;
					}
					td.appendChild(nouveauBouton);
				}
			} else {
				let nouveauBouton = document.createElement('button');
				nouveauBouton.onclick = function(event) {
					JeuManager.gererPause(poste, event);
				};
				nouveauBouton.dataset.id = poste;
				if (joueusesEnPause[nouveauBouton.dataset.id] === nomPause) {
					nouveauBouton.className = 'pause-active';
					nouveauBouton.textContent = `Retour (${nomPrison})`;
				} else {
					nouveauBouton.className = 'pause-hidden';
					nouveauBouton.textContent = `Pause (${nomPrison})`;
				}
				td.appendChild(nouveauBouton);
			}
			tr.appendChild(td);
		});

		tbody.appendChild(tr);
		tableHTML.appendChild(tbody);

		if (prochaineLigneTableau) {
			prochaineLigneDiv.replaceChild(tableHTML, prochaineLigneTableau);
		} else {
			prochaineLigneDiv.appendChild(tableHTML);
		}
		prochaineLigneTableau = tableHTML;

		// Mise à jour de la visibilité des boutons Pause
		JeuManager.mettreAJourVisibiliteBoutonsPause();
	},
	
	initialiserBoutonsPause: function() {
		console.log("JeuManager.initialiserBoutonsPause() appelé"); // Ajouter ce log
		const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];
		postesOrdre.forEach(poste => {
			let cellule = document.querySelector(`#prochaineLigne td[data-poste="${poste}"]`);
			if (cellule) {
				// Sélectionner tous les boutons dans la cellule
				const boutons = cellule.querySelectorAll('button');
				boutons.forEach(bouton => {
					cellule.removeChild(bouton);
				});

				let nomPrison = lignes[ligneActuelleIndex][poste];
				let nomPause = lignes[(ligneActuelleIndex + 1) % lignes.length][poste];

				if (poste.startsWith('blocker')) {
					// Créer 3 boutons pour chaque bloqueuse
					for (let i = 0; i < 3; i++) {
						let nouveauBouton = document.createElement('button');
						nouveauBouton.onclick = function(event) {
							JeuManager.gererPause(poste, event);
						};
						if (joueusesEnPause[`${poste}-${nouveauBouton.textContent}`] === nomPause) {
							nouveauBouton.className = 'pause-active';
							nouveauBouton.textContent = `Retour (${nomPrison})`;
						} else {
							nouveauBouton.className = '';
							nouveauBouton.textContent = `Pause (${nomPrison})`;
						}
						cellule.appendChild(nouveauBouton);
					}
				} else {
					// Créer un seul bouton pour jammer et pivot
					let nouveauBouton = document.createElement('button');
					nouveauBouton.onclick = function(event) {
						JeuManager.gererPause(poste, event);
					};
					if (joueusesEnPause[`${poste}-${nouveauBouton.textContent}`] === nomPause) {
						nouveauBouton.className = 'pause-active';
						nouveauBouton.textContent = `Retour (${nomPrison})`;
					} else {
						nouveauBouton.className = '';
						nouveauBouton.textContent = `Pause (${nomPrison})`;
					}
					cellule.appendChild(nouveauBouton);
				}
			}
		});
	},
		mettreAJourVisibiliteBoutonsPause: function() {
		const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];
		if (lignes && lignes.length > 0) {
			const prochaineLigne = lignes[(ligneActuelleIndex + 1) % lignes.length];

			// Réinitialiser la visibilité de tous les boutons
			for (let i = 0; i < 3; i++) {
				['blocker0', 'blocker1', 'blocker2'].forEach(poste => {
					let bouton = document.querySelector(`button[data-id="${poste}-${i}"]`);
					if (bouton) {
						bouton.classList.add('pause-hidden');
					}
				});
			}

			// Afficher les boutons en fonction des bloqueuses en prison
			['blocker0', 'blocker1', 'blocker2'].forEach((poste, index) => {
				const nomPrison = lignes[ligneActuelleIndex][poste];
				if (joueusesEnPrison.includes(nomPrison)) {
					['blocker0', 'blocker1', 'blocker2'].forEach(prochainPoste => {
						let bouton = document.querySelector(`button[data-id="${prochainPoste}-${index}"]`);
						if (bouton) {
							bouton.classList.remove('pause-hidden');
						}
					});
				}
			});

			// Gestion des boutons Jammer et Pivot
			['jammer', 'pivot'].forEach(poste => {
				const nomPrison = lignes[ligneActuelleIndex][poste];
				const nomPause = prochaineLigne[poste];
				if (joueusesEnPrison.includes(nomPrison)) {
					let bouton = document.querySelector(`button[data-id="${poste}"]`);
					if (bouton) {
						bouton.classList.remove('pause-hidden');
					}
				} else {
					let bouton = document.querySelector(`button[data-id="${poste}"]`);
					if (bouton) {
						bouton.classList.add('pause-hidden');
					}
				}
			});
		} else {
			console.error("lignes n'est pas initialisé ou est vide");
		}
	},
	initialiser: function() {
		console.log("JeuManager.initialiser() appelé");

		JeuManager.afficherJoueusesEnJeu();
		JeuManager.creerEtAfficherProchaineLigne();

		const ligneActuelle = lignes[ligneActuelleIndex];
		const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];
		postesOrdre.forEach((poste, index) => {
			const joueuse = ligneActuelle[postesOrdre[index]];
			if (!stats[joueuse]) {
				stats[joueuse] = { fautes: 0, prisons: 0, pauses: 0, jamsJoues: 1 };
			} else {
				stats[joueuse].jamsJoues = 1;
			}
		});

		localStorage.setItem('stats', JSON.stringify(stats));
	},

	nextJam: function() {
		console.log("JeuManager.nextJam() appelé");

		ligneActuelleIndex = (ligneActuelleIndex + 1) % lignes.length;
		compteurJams++;
		localStorage.setItem('compteurJams', compteurJams);

		const ligneActuelle = lignes[ligneActuelleIndex];
		const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];
		postesOrdre.forEach((poste, index) => {
			const joueuse = ligneActuelle[postesOrdre[index]];
			if (!stats[joueuse]) {
				stats[joueuse] = { fautes: 0, prisons: 0, pauses: 0, jamsJoues: 0 };
			}
			stats[joueuse].jamsJoues++;
		});

		localStorage.setItem('stats', JSON.stringify(stats));
		JeuManager.afficher();
		JeuManager.creerEtAfficherProchaineLigne();
	},
		
	mettreAJourStats: function() {
		console.log("JeuManager.mettreAJourStats() appelé");

		const statsTable = document.getElementById('statsTable').getElementsByTagName('tbody')[0];
		statsTable.innerHTML = '';

		roster.forEach(joueuse => {
			const joueuseStats = stats[joueuse.nom] || { fautes: 0, prisons: 0, pauses: 0, jamsJoues: 0 };
			const row = statsTable.insertRow();
			const nomCell = row.insertCell(0);
			const numeroCell = row.insertCell(1);
			const jamsJouesCell = row.insertCell(2);
			const pourcentageCell = row.insertCell(3);
			const prisonsCell = row.insertCell(4);
			const pausesCell = row.insertCell(5);
			const fautesCell = row.insertCell(6);

			nomCell.textContent = joueuse.nom;
			numeroCell.textContent = joueuse.numero;
			jamsJouesCell.textContent = joueuseStats.jamsJoues;
			pourcentageCell.textContent = compteurJams > 1 ? Math.round((joueuseStats.jamsJoues / (compteurJams)) * 100) + '%' : '0%';
			prisonsCell.textContent = joueuseStats.prisons;
			pausesCell.textContent = joueuseStats.pauses;
			fautesCell.textContent = joueuseStats.fautes;
		});
	},
	
    resetStats: function() {
		console.log("JeuManager.resetStats() appelé");

		stats = {};
		localStorage.setItem('stats', JSON.stringify(stats));
		compteurJams = 1;
		localStorage.setItem('compteurJams', compteurJams);
		JeuManager.mettreAJourStats();

		const ligneActuelle = lignes[ligneActuelleIndex];
		const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];
		postesOrdre.forEach((poste, index) => {
			const joueuse = ligneActuelle[postesOrdre[index]];
			if (!stats[joueuse]) {
				stats[joueuse] = { fautes: 0, prisons: 0, pauses: 0, jamsJoues: 1 };
			} else {
				stats[joueuse].jamsJoues = 1;
			}
		});

		localStorage.setItem('stats', JSON.stringify(stats));
	},
};

// Initialisation des données au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const page = document.body.dataset.page;
    if (page === 'roster') {
        RosterManager.initialiser();
    } else if (page === 'lignes') {
        LignesManager.initialiser();
    } else if (page === 'jeu') {
        JeuManager.initialiser();
        initialiserBoutons();
        document.getElementById('nextJamButton').addEventListener('click', JeuManager.nextJam);
    }
});

// Fonctions de drag and drop pour les lignes
function dragStart(event) {
    event.dataTransfer.setData("text/plain", event.target.dataset.index);
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const fromIndex = event.dataTransfer.getData("text/plain");
    const toIndex = event.target.dataset.index;

    if (fromIndex !== toIndex) {
        const temp = lignes[fromIndex];
        lignes.splice(fromIndex, 1);
        lignes.splice(toIndex, 0, temp);

        LignesManager.sauvegarder();
        LignesManager.mettreAJour();
    }
}