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
		console.log("LignesManager.initialiser() appelé"); // Ajouter ce log
		const lignesTable = document.getElementById('lignesTable');
		if (lignesTable) {
			const table = lignesTable.getElementsByTagName('tbody')[0];
			table.innerHTML = '';
			lignes.forEach((ligne, index) => {
				let row = table.insertRow();
				let numeroCell = row.insertCell(0);
				let jammerCell = row.insertCell(1);
				let pivotCell = row.insertCell(2);
				let blocker1Cell = row.insertCell(3);
				let blocker2Cell = row.insertCell(4);
				let blocker3Cell = row.insertCell(5);
				let actionsCell = row.insertCell(6);

				numeroCell.textContent = index + 1;
				jammerCell.textContent = ligne.jammer;
				pivotCell.textContent = ligne.pivot;
				blocker1Cell.textContent = ligne.blocker0;
				blocker2Cell.textContent = ligne.blocker1;
				blocker3Cell.textContent = ligne.blocker2;

				let supprimerBtn = document.createElement('button');
				supprimerBtn.textContent = 'Supprimer';
				supprimerBtn.onclick = () => this.supprimerLigne(index);

				actionsCell.appendChild(supprimerBtn);
			});

			// Vérification pour 'ajouterLigne'
			const ajouterLigneButton = document.getElementById('ajouterLigne');
			if (ajouterLigneButton) {
				ajouterLigneButton.addEventListener('click', this.ajouterLigne.bind(this));
			} else {
				console.error("L'élément avec l'ID 'ajouterLigne' n'a pas été trouvé dans LignesManager.initialiser.");
			}

			// Vérification pour 'sauvegarderLignes'
			const sauvegarderLignesButton = document.getElementById('sauvegarderLignes');
			if (sauvegarderLignesButton) {
				sauvegarderLignesButton.addEventListener('click', this.sauvegarderLignes.bind(this));
			} else {
				console.error("L'élément avec l'ID 'sauvegarderLignes' n'a pas été trouvé dans LignesManager.initialiser.");
			}
		} else {
			console.error("L'élément avec l'ID 'lignesTable' n'a pas été trouvé dans LignesManager.initialiser.");
		}
	},
    mettreAJour: function() {
        const table = document.getElementById('lignesTable').getElementsByTagName('tbody')[0];
        table.innerHTML = '';
        lignes.forEach((ligne, index) => {
            let row = table.insertRow();
            ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'].forEach(poste => {
                let cell = row.insertCell();
                cell.setAttribute('data-index', index);
                cell.setAttribute('data-poste', poste);
                cell.setAttribute('ondrop', 'drop(event)');
                cell.setAttribute('ondragover', 'allowDrop(event)');

                let select = this.creerListeDeroulante(roster.map(j => j.nom), ligne[poste]);
                select.onchange = (event) => this.mettreAJourLigne(index, poste, event.target.value);
                cell.appendChild(select);
            });
            let deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Supprimer';
            deleteBtn.onclick = () => this.supprimer(index);
            row.insertCell().appendChild(deleteBtn);
        });
    },
    creerListeDeroulante: function(joueuses, nomSelectionne) {
        let select = document.createElement('select');
        joueuses.forEach(nom => {
            let option = document.createElement('option');
            option.value = nom;
            option.text = nom;
            if (nom === nomSelectionne) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        return select;
    },
    mettreAJourLigne: function(index, poste, nom) {
        lignes[index][poste] = nom;
        this.sauvegarder();
    },
    ajouter: function() {
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
    }
};

// Fonctions de gestion du Jeu (jeu.html)
const JeuManager = {
	gererPrison: function(nom) {
		console.log(`JeuManager.gererPrison() appelé avec nom: ${nom}`);

		if (joueusesEnPrison.includes(nom)) {
			joueusesEnPrison = joueusesEnPrison.filter(joueuse => joueuse !== nom);
			// Mettre à jour l'état des boutons Pause/Retour si la joueuse libérée est Jammer ou Pivot
			if (lignes[ligneActuelleIndex].jammer === nom || lignes[ligneActuelleIndex].pivot === nom) {
				const poste = lignes[ligneActuelleIndex].jammer === nom ? 'jammer' : 'pivot';
				const prochaineLigne = lignes[(ligneActuelleIndex + 1) % lignes.length];
				const nomPause = prochaineLigne[poste];
				const boutonId = poste; // Utiliser l'identifiant unique (poste)

				// Mettre à jour l'état dans joueusesEnPause
				delete joueusesEnPause[boutonId];

				// Mettre à jour l'affichage des boutons
				JeuManager.creerEtAfficherProchaineLigne();
			}
		} else {
			joueusesEnPrison.push(nom);
			const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];
			if (postesOrdre.slice(2).some(p => lignes[ligneActuelleIndex][p] === nom)) {
				bloqueusesEnPrisonOrdre.push(nom);
			}
			// Ici, il faut ajouter la logique pour incrémenter les stats
			if (!stats[nom]) {
				stats[nom] = { fautes: 0, prisons: 0, pauses: 0 };
			}
			stats[nom].prisons++;
			stats[nom].fautes++; // Incrémenter le nombre de fautes
		}

		localStorage.setItem('stats', JSON.stringify(stats));
		JeuManager.afficher();
	},
		ajouterFaute: function(nom) {
        if (!stats[nom]) {
            stats[nom] = { fautes: 0, pauses: 0 };
        }
        stats[nom].fautes++;
        localStorage.setItem('stats', JSON.stringify(stats));
        JeuManager.afficher();
    },
	gererPause: function(poste, event) {
		console.log(`JeuManager.gererPause() appelé avec poste: ${poste}`);

		const nomPrison = lignes[ligneActuelleIndex][poste];
		const nomPause = lignes[(ligneActuelleIndex + 1) % lignes.length][poste];
		const boutonId = event.target.dataset.id; // Utiliser data-id

		console.log(`boutonId: ${boutonId}`);
		console.log(`joueusesEnPause[boutonId]: ${joueusesEnPause[boutonId]}`);
		console.log(`nomPause: ${nomPause}`);

		// Mettre à jour l'état du bouton avant de générer boutonId
		if (joueusesEnPause[boutonId] === nomPause) {
			delete joueusesEnPause[boutonId];
			event.target.className = '';
			event.target.textContent = `Pause (${nomPrison})`;

			// Décrémenter le nombre de pauses
			if (stats[nomPause]) {
				stats[nomPause].pauses--;
			}
		} else {
			joueusesEnPause[boutonId] = nomPause;
			event.target.className = 'pause-active';
			event.target.textContent = `Retour (${nomPrison})`;

			// Incrémenter le nombre de pauses
			if (!stats[nomPause]) {
				stats[nomPause] = { fautes: 0, prisons: 0, pauses: 0 };
			}
			stats[nomPause].pauses++;
		}

		localStorage.setItem('stats', JSON.stringify(stats));
		JeuManager.afficher();
		JeuManager.creerEtAfficherProchaineLigne();
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
					nouveauBouton.dataset.id = `${poste}-${i}`; // Ajouter data-id
					if (joueusesEnPause[nouveauBouton.dataset.id] === nomPause) {
						nouveauBouton.className = 'pause-active';
						nouveauBouton.textContent = `Retour (${nomPrison})`;
					} else {
						nouveauBouton.className = '';
						nouveauBouton.textContent = `Pause (${nomPrison})`;
					}
					td.appendChild(nouveauBouton);
				}
			} else {
				let nouveauBouton = document.createElement('button');
				nouveauBouton.onclick = function(event) {
					JeuManager.gererPause(poste, event);
				};
				nouveauBouton.dataset.id = poste; // Ajouter data-id
				if (joueusesEnPause[nouveauBouton.dataset.id] === nomPause) {
					nouveauBouton.className = 'pause-active';
					nouveauBouton.textContent = `Retour (${nomPrison})`;
				} else {
					nouveauBouton.className = '';
					nouveauBouton.textContent = `Pause (${nomPrison})`;
				}
				td.appendChild(nouveauBouton);
			}

			tr.appendChild(td);
		});

		tbody.appendChild(tr);
		tableHTML.appendChild(tbody);

		// Remplacer l'ancien tableau par le nouveau
		if (prochaineLigneTableau) {
			prochaineLigneDiv.replaceChild(tableHTML, prochaineLigneTableau);
		} else {
			prochaineLigneDiv.appendChild(tableHTML);
		}

		// Mettre à jour la référence au tableau
		prochaineLigneTableau = tableHTML;
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
	
	initialiser: function() {
        console.log("JeuManager.initialiser() appelé");

        JeuManager.afficherJoueusesEnJeu();
        JeuManager.creerEtAfficherProchaineLigne();

        // Initialiser les statistiques "Jam Joués" à 1 pour les joueuses de la première ligne
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

        localStorage.setItem('stats', JSON.stringify(stats)); // Sauvegarder stats
    },

	nextJam: function() {
		console.log("JeuManager.nextJam() appelé");

		ligneActuelleIndex = (ligneActuelleIndex + 1) % lignes.length;
		compteurJams++;
		localStorage.setItem('compteurJams', compteurJams);

		// Incrémenter le nombre de "Jam Joués" pour chaque joueuse en jeu
		const ligneActuelle = lignes[ligneActuelleIndex];
		const postesOrdre = ['jammer', 'pivot', 'blocker0', 'blocker1', 'blocker2'];
		postesOrdre.forEach((poste, index) => {
			const joueuse = ligneActuelle[postesOrdre[index]];
			console.log(`Joueuse: ${joueuse}`);
			console.log(`Stats avant: ${JSON.stringify(stats[joueuse])}`);
			if (!stats[joueuse]) {
				stats[joueuse] = { fautes: 0, prisons: 0, pauses: 0, jamsJoues: 0 };
			}
			stats[joueuse].jamsJoues++;
			console.log(`Stats après: ${JSON.stringify(stats[joueuse])}`);
		});

		localStorage.setItem('stats', JSON.stringify(stats)); // Sauvegarder stats
		console.log(`Stats sauvegardées: ${JSON.stringify(stats)}`);

		JeuManager.afficher();
		JeuManager.creerEtAfficherProchaineLigne();
	},
	
	mettreAJourStats: function() {
		console.log("JeuManager.mettreAJourStats() appelé");

		const statsTable = document.getElementById('statsTable').getElementsByTagName('tbody')[0];
		statsTable.innerHTML = ''; // Effacer le tableau existant

		roster.forEach(joueuse => {
			const joueuseStats = stats[joueuse.nom] || { fautes: 0, prisons: 0, pauses: 0, jamsJoues: 0 }; // Initialiser les stats à zéro si elles n'existent pas
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
			pourcentageCell.textContent = compteurJams > 1 ? Math.round((joueuseStats.jamsJoues / (compteurJams)) * 100) + '%' : '0%'; // Calcul corrigé
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

        // Réinitialiser les statistiques "Jam Joués" à 1 pour les joueuses de la première ligne
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

        localStorage.setItem('stats', JSON.stringify(stats)); // Sauvegarder stats
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