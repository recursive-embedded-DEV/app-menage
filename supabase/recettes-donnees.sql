-- =====================================================================
-- APP-M&M : les 9 recettes migrées de src/data/recettes.json (R1, partie 2)
-- Fichier GÉNÉRÉ. À exécuter UNE FOIS, APRÈS recettes.sql.
-- Les codes FCEN des ingrédients deviennent des aliment_id (sous-requêtes).
-- =====================================================================

begin;

-- Macaroni protéiné et dinde hachée
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('macaroni-proteine', 'Macaroni protéiné et dinde hachée', 'macaroni-proteine.webp', 10, 15, 0, '4 portions', 4, $j$[{"section":"","items":["Dans une grande casserole d'eau bouillante salée, faites cuire les pâtes environ 10 minutes. Égouttez les pâtes et remettez-les dans la casserole.","Dans une poêle anti-adhésive, faites cuire la dinde hachée. Salez et poivrez.","Ajoutez les légumes cuits et la sauce tomate. Mélangez pour bien enrober les pâtes.","Dans des assiettes, répartissez les pâtes. Parsemez de fromage au goût."]}]$j$::jsonb, $j$[]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('macaroni-proteine', '', 1, 'Macaroni Protéine+, Catelli', '1 boîte', (select id from public.aliments where code_fcen = 4516), 340),
  ('macaroni-proteine', '', 2, 'Dinde, hachée', '450 g', (select id from public.aliments where code_fcen = 754), 450),
  ('macaroni-proteine', '', 3, 'Légumes variés, frais ou congelés', 'Au goût', null, null),
  ('macaroni-proteine', '', 4, 'Sauce tomate', '2 tasses', (select id from public.aliments where code_fcen = 5557), 515.6),
  ('macaroni-proteine', '', 5, 'Sel et poivre', 'Au goût', null, null);

-- Pokebowl au saumon
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('pokebowl-saumon', 'Pokebowl au saumon', 'pokebowl-saumon.webp', 15, 0, 0, '2 portions', 2, $j$[{"section":"","items":["Plongez les sachets de saumon dans l'eau froide environ 10 minutes ou jusqu'au dégel complet.","Dans une casserole moyenne, faites cuire le riz blanc.","Pendant ce temps, lavez et coupez les légumes, la laitue et les fruits.","Assemblez les pokebowl comme souhaité."]}]$j$::jsonb, $j$[]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('pokebowl-saumon', '', 1, 'Riz blanc, cuit', '200 g', (select id from public.aliments where code_fcen = 4475), 200),
  ('pokebowl-saumon', '', 2, 'Poke au saumon, DOM Reserve', '2 portions', (select id from public.aliments where code_fcen = 3182), 250),
  ('pokebowl-saumon', '', 3, 'Carottes moyennes, râpées', '2', (select id from public.aliments where code_fcen = 2380), 122),
  ('pokebowl-saumon', '', 4, 'Mini-concombres, coupés en quartier', '2', (select id from public.aliments where code_fcen = 2363), 200),
  ('pokebowl-saumon', '', 5, 'Fraises, effilées', '80 g', (select id from public.aliments where code_fcen = 1749), 80),
  ('pokebowl-saumon', '', 6, 'Edamames', '80 g', (select id from public.aliments where code_fcen = 2209), 80),
  ('pokebowl-saumon', '', 7, 'Laitue', 'Au goût', null, null),
  ('pokebowl-saumon', '', 8, 'Coriandre', 'Au goût', null, null),
  ('pokebowl-saumon', '', 9, 'Mayo épicée', '1 c. à table', (select id from public.aliments where code_fcen = 531), 14);

-- Bol façon bành mì
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('banh-mi', 'Bol façon bành mì', 'banh-mi.webp', 40, 20, 20, '4 portions', 4, $j$[{"section":"Pour les carottes et les radis marinés","items":["Dans un pot en verre stérilisé, mettez les bâtonnets de carottes et les radis émincés.","Dans une petite casserole, à feu moyen, faites chauffer le vinaigre, le sucre et le sel en remuant de temps en temps, jusqu’à ce que le sucre soit dissous.","Versez la saumure sur les légumes (ce n’est pas grave si le mélange ne les recouvre pas entièrement). Mélangez le tout et laissez reposer à température ambiante 20 minutes. Vous pouvez préparer les légumes marinés la veille et les conserver plusieurs semaines au réfrigérateur."]},{"section":"Pour la vinaigrette","items":["Dans un grand bol, mélangez tous les ingrédients jusqu’à ce que le sucre soit dissous. Réservez la vinaigrette."]},{"section":"Pour les nouilles","items":["Faites cuire les nouilles selon les instructions de l’emballage. Égouttez-les et rincez-les sous l’eau froide. Ajoutez l’huile de sésame et mélangez les nouilles pour éviter qu’elles collent ensemble. Réservez-les."]},{"section":"Pour les boulettes","items":["Dans un grand bol, mélangez tous les ingrédients des boulettes sauf l’huile. Formez 16 boulettes, sans trop les compacter afin qu’elles restent moelleuses.","Dans une poêle antiadhésive, à feu moyen-élevé, faites chauffer l’huile. Faites cuire les boulettes de 3 à 5 minutes de chaque côté ou jusqu’à ce qu’elles soient cuites."]},{"section":"Pour le service","items":["Répartissez les nouilles dans des bols. Arrosez de la moitié de la vinaigrette. Ajoutez les boulettes, les légumes marinés et le concombre. Parsemez généreusement de feuilles de coriandre, de menthe et d’arachides concassées. Servez les bols accompagnés du reste de la vinaigrette."]}]$j$::jsonb, $j$["Piment thaï : remplaçable par 2,5 ml de sambal oelek.","Nouilles : remplaçables par du riz."]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('banh-mi', 'Pour les carottes et les radis marinés', 1, 'Petites carottes, pelées et coupées en bâtonnets', '3', (select id from public.aliments where code_fcen = 2380), 150),
  ('banh-mi', 'Pour les carottes et les radis marinés', 2, 'Radis roses, finement émincés', '3', (select id from public.aliments where code_fcen = 2443), 13.5),
  ('banh-mi', 'Pour les carottes et les radis marinés', 3, 'Vinaigre', '250 mL', null, null),
  ('banh-mi', 'Pour les carottes et les radis marinés', 4, 'Sucre', '30 mL', null, null),
  ('banh-mi', 'Pour les carottes et les radis marinés', 5, 'Sel', '2,5 mL', null, null),
  ('banh-mi', 'Pour la vinaigrette', 6, 'Jus de lime', '3 c. à soupe', (select id from public.aliments where code_fcen = 1594), 46.8),
  ('banh-mi', 'Pour la vinaigrette', 7, 'Sauce soya', '2 c. à soupe', (select id from public.aliments where code_fcen = 3403), 32.4),
  ('banh-mi', 'Pour la vinaigrette', 8, 'Sucre', '2 c. à soupe', (select id from public.aliments where code_fcen = 4318), 25.4),
  ('banh-mi', 'Pour la vinaigrette', 9, 'Sauce de poisson', '1 c. à soupe', (select id from public.aliments where code_fcen = 4731), 18.2),
  ('banh-mi', 'Pour la vinaigrette', 10, 'Piment thaï, épépiné et finement émincé', '1/2', (select id from public.aliments where code_fcen = 4858), 3),
  ('banh-mi', 'Pour les nouilles', 11, 'Nouilles', 'À compléter', null, null),
  ('banh-mi', 'Pour les nouilles', 12, 'Huile de sésame', 'À compléter', null, null),
  ('banh-mi', 'Pour les boulettes', 13, 'Porc haché', '450 g', (select id from public.aliments where code_fcen = 6121), 450),
  ('banh-mi', 'Pour les boulettes', 14, 'Coriandre haché', '2 c. à soupe', (select id from public.aliments where code_fcen = 2067), 2),
  ('banh-mi', 'Pour les boulettes', 15, 'Ciboulette, finement haché', '2 c. à soupe', (select id from public.aliments where code_fcen = 2059), 6),
  ('banh-mi', 'Pour les boulettes', 16, 'Gousses d''ail, finement haché', '2', (select id from public.aliments where code_fcen = 2394), 6),
  ('banh-mi', 'Pour les boulettes', 17, 'Sel fin', '1 c. à thé', (select id from public.aliments where code_fcen = 214), 6.1),
  ('banh-mi', 'Pour les boulettes', 18, 'Sambal oelek', '1/2 c. à thé', (select id from public.aliments where code_fcen = 7593), 3.3),
  ('banh-mi', 'Pour les boulettes', 19, 'Poivre du moulin', '1/4 c. à thé', (select id from public.aliments where code_fcen = 198), 0.6),
  ('banh-mi', 'Pour les boulettes', 20, 'Huile de canola', '1 c. à soupe', (select id from public.aliments where code_fcen = 451), 14.2),
  ('banh-mi', 'Pour le service', 21, 'Concombres libanais, taillés en rubans', '2', (select id from public.aliments where code_fcen = 2363), 240),
  ('banh-mi', 'Pour le service', 22, 'Feuilles de coriandre', '1/2 tasse', (select id from public.aliments where code_fcen = 2067), 8.5),
  ('banh-mi', 'Pour le service', 23, 'Feuilles de menthe fraîche', '1/2 tasse', (select id from public.aliments where code_fcen = 4725), 10),
  ('banh-mi', 'Pour le service', 24, 'Arachides salées, concassées', 'Au goût', null, null);

-- Pain aux bananes
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('pain-aux-bananes', 'Pain aux bananes', '', 15, 45, 0, '8 à 10 tranches', 10, $j$[{"section":"","items":["Préchauffez le four à 180 °C (350 °F). Huilez légèrement un moule à pain de 23 x 13 cm (9 x 5 po).","Dans un bol, mélangez la farine, les flocons d'avoine, les graines de chia, la poudre à pâte, le bicarbonate de soude et le sel.","Dans un grand bol, mélangez la purée de bananes, l'huile de coco, le sirop d'érable et la vanille. Ajoutez les ingrédients secs et incorporez-les au fouet. Ajoutez les pépites de chocolat, si désiré.","Versez la pâte dans le moule. Faites cuire au four environ 45 minutes, ou jusqu'à ce qu'un cure-dent inséré au centre en ressorte propre.","Laissez tiédir avant de démouler et de trancher."]}]$j$::jsonb, $j$[]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('pain-aux-bananes', '', 1, 'Farine de blé entier ou d''épeautre', '1 tasse', (select id from public.aliments where code_fcen = 4500), 126.8),
  ('pain-aux-bananes', '', 2, 'Flocons d''avoine à cuisson rapide', '3/4 tasse', (select id from public.aliments where code_fcen = 1439), 79.2),
  ('pain-aux-bananes', '', 3, 'Graines de chia entières', '2 c. à soupe', (select id from public.aliments where code_fcen = 2511), 21.6),
  ('pain-aux-bananes', '', 4, 'Poudre à pâte', '2 c. à thé', (select id from public.aliments where code_fcen = 4003), 9.4),
  ('pain-aux-bananes', '', 5, 'Bicarbonate de soude', '1/2 c. à thé', (select id from public.aliments where code_fcen = 4005), 2.4),
  ('pain-aux-bananes', '', 6, 'Sel', '1/2 c. à thé', (select id from public.aliments where code_fcen = 214), 3.1),
  ('pain-aux-bananes', '', 7, 'Bananes mûres, en purée', '4', (select id from public.aliments where code_fcen = 1704), 472),
  ('pain-aux-bananes', '', 8, 'Huile de coco', '1/3 tasse', (select id from public.aliments where code_fcen = 420), 76.8),
  ('pain-aux-bananes', '', 9, 'Sirop d''érable (optionnel)', '2 c. à soupe', (select id from public.aliments where code_fcen = 6175), 40.6),
  ('pain-aux-bananes', '', 10, 'Extrait de vanille', '1 c. à thé', (select id from public.aliments where code_fcen = 216), 4.3),
  ('pain-aux-bananes', '', 11, 'Pépites de chocolat (optionnel)', 'Au goût', null, null);

-- Pain de blé entier aux graines
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('pain-ble-entier-graines', 'Pain de blé entier aux graines', '', 30, 45, 180, '1 pain', 1, $j$[{"section":"","items":["Gel de chia. Mélanger le chia avec l'eau tiède. Brasser 1 à 2 fois dans les 2 premières minutes, puis laisser gonfler 20 à 30 min, jusqu'à une texture gélatineuse sans eau libre.","Activer la levure. Dans une partie de l'eau tiède restante, avec une pincée du sirop d'érable, laisser mousser environ 10 min.","Mélanger et pétrir. Au robot sur pied, combiner les ingrédients secs (lin compris), les ingrédients humides et le gel de chia. Pétrir environ 10 min. Ajuster la farine 1 c. à soupe à la fois, jusqu'à ce que la pâte se rassemble, s'enroule autour du crochet et nettoie les parois.","1re levée (pointage). Dans un bol huilé et couvert, laisser lever environ 2 h, ou jusqu'à ce que la pâte ait doublé de volume.","Dégazer et façonner. Renverser la pâte sur une surface très peu farinée. L'aplatir en rectangle (largeur = longueur du moule), la rouler serré, sceller la couture et replier les bouts dessous. Déposer couture vers le bas dans le moule beurré.","2e levée (apprêt). Couvrir et laisser lever 45 min à 1 h, jusqu'à environ 1 po (2 à 3 cm) au-dessus du rebord.","Cuire. Cuire à 350 °F de 35 à 45 min, jusqu'à 88 à 90 °C à cœur. Couvrir d'une tente de papier d'aluminium si le dessus dore trop vite.","Finir et refroidir. Badigeonner de beurre fondu à la sortie du four. Démouler dans les 5 à 10 min sur une grille. Laisser refroidir au moins 1 h (idéalement 1 h 30 à 2 h) avant de trancher."]}]$j$::jsonb, $j$["Test du doigt (levées 4 et 6) : enfoncer doucement un doigt fariné. L'empreinte remonte lentement et reste un peu creuse : c'est prêt. Elle rebondit aussitôt : attendre. Elle reste complètement enfoncée : un peu trop levé, enfourner sans tarder.","Chia et lin volent l'eau. Le chia est déjà pré-hydraté en gel; pour le lin, prévoir un peu d'eau en plus (environ 75 % de son poids) ou ajuster à la main au pétrissage.","Fermentation ralentie. Les graines allongent un peu les levées : se fier au volume, pas au chrono.","Moule. Le métal antiadhésif clair est le meilleur choix. En verre, baisser à 325 °F et surveiller le dessous.","Pas de badigeon d'œuf : il fonce et durcit la croûte (réservé aux pains riches type brioche).","Dépannage — forme en champignon : pâte trop levée, gluten faible du blé entier ou façonnage lâche. Enfourner à environ 1 po au-dessus du rebord, moule 9 x 5 po, roulage serré, ratio de farines 50/50.","Dépannage — croûte trop foncée : four trop chaud ou moule foncé. Cuire à 350 °F, tente d'aluminium en fin de cuisson, moule en métal clair.","Dépannage — mie dense ou sèche : graines qui volent l'eau, trop de farine ou trop de blé entier. Pré-tremper le chia, compter son eau dans l'hydratation, arrêter d'ajouter de la farine dès que la pâte se décolle.","Dépannage — pâte qui colle aux doigts : hydratation trop élevée. Ajouter de la farine 1 c. à soupe à la fois; viser « collante au toucher, pas gluante »."]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('pain-ble-entier-graines', 'Gel de chia (à préparer 20 à 30 min d''avance)', 1, 'Graines de chia entières', '25 g (≈ 2 c. à soupe)', (select id from public.aliments where code_fcen = 2511), 25),
  ('pain-ble-entier-graines', 'Gel de chia (à préparer 20 à 30 min d''avance)', 2, 'Eau tiède, prélevée sur l''eau des ingrédients humides', '1/3 tasse', null, null),
  ('pain-ble-entier-graines', 'Ingrédients secs', 3, 'Farine de blé entier', '2 tasses', (select id from public.aliments where code_fcen = 4500), 253.6),
  ('pain-ble-entier-graines', 'Ingrédients secs', 4, 'Farine tout usage non blanchie', '2 tasses', (select id from public.aliments where code_fcen = 6642), 264.2),
  ('pain-ble-entier-graines', 'Ingrédients secs', 5, 'Lin moulu', '25 g (≈ 3 1/2 c. à soupe)', (select id from public.aliments where code_fcen = 4528), 25),
  ('pain-ble-entier-graines', 'Ingrédients secs', 6, 'Sel', '1 1/4 c. à thé', (select id from public.aliments where code_fcen = 214), 7.6),
  ('pain-ble-entier-graines', 'Ingrédients secs', 7, 'Farine en réserve, pour ajuster au pétrissage', '1/2 à 1 tasse', (select id from public.aliments where code_fcen = 6642), 66),
  ('pain-ble-entier-graines', 'Ingrédients humides', 8, 'Eau tiède, au total (dont 1/3 tasse pour le gel de chia)', '1 1/2 tasse', null, null),
  ('pain-ble-entier-graines', 'Ingrédients humides', 9, 'Levure instantanée', '8 g (≈ 2 1/4 c. à thé)', null, null),
  ('pain-ble-entier-graines', 'Ingrédients humides', 10, 'Sirop d''érable', '1/4 tasse', (select id from public.aliments where code_fcen = 6175), 84.6),
  ('pain-ble-entier-graines', 'Ingrédients humides', 11, 'Beurre fondu', '1/4 tasse', (select id from public.aliments where code_fcen = 118), 60),
  ('pain-ble-entier-graines', 'Finition de la croûte', 12, 'Lait, avant cuisson (croûte pâle, satinée)', 'Pour badigeonner', null, null),
  ('pain-ble-entier-graines', 'Finition de la croûte', 13, 'Beurre fondu, à la sortie du four (croûte tendre)', 'Pour badigeonner', null, null);

-- Potage de courge Butternut
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('potage-courge', 'Potage de courge Butternut', 'potage-courge.webp', 20, 30, 0, '4 portions', 4, $j$[{"section":"","items":["Dans une casserole à feu moyen, faites dorer l'oignon, le gingembre et l'ail dans l'huile.","Ajoutez la chair de courge, l'eau et le bouillon de poulet en poudre.","Portez le liquide à ébullition et laissez cuire environ 20 minutes jusqu'à ce que la courge soit cuite.","Hors du feu, à l'aide d'un bras mélangeur, réduisez le potage en purée. Ajustez l'assaisonnement au goût."]}]$j$::jsonb, $j$[]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('potage-courge', '', 1, 'Oignons, coupés en dés', '1/2', (select id from public.aliments where code_fcen = 2401), 55),
  ('potage-courge', '', 2, 'Gingembre frais haché', '1 c. à thé', (select id from public.aliments where code_fcen = 2091), 2),
  ('potage-courge', '', 3, 'Gousses d''ail, hachées', '3', (select id from public.aliments where code_fcen = 2394), 9),
  ('potage-courge', '', 4, 'Huile d''olive', '3 c. à soupe', (select id from public.aliments where code_fcen = 422), 41.1),
  ('potage-courge', '', 5, 'Courge Butternut, pelée, épépinée et coupée en dés', '1 kg', (select id from public.aliments where code_fcen = 2451), 1000),
  ('potage-courge', '', 6, 'Eau', '4 tasses', null, null),
  ('potage-courge', '', 7, 'Poudre de bouillon de légumes', '3 c. à soupe', (select id from public.aliments where code_fcen = 972), 18),
  ('potage-courge', '', 8, 'Sel et poivre', 'Au goût', null, null);

-- Quesadilla au poulet
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('quesadilla', 'Quesadilla au poulet', 'quesadilla.webp', 5, 5, 0, '1 quesadilla', 1, $j$[{"section":"","items":["Garnissez de fromage la moitié d’une tortilla.","Ajoutez le poulet, les oignons verts et les épices choisies.","Repliez en deux, huilez légèrement et faites cuire à la poêle à feu moyen quelques minutes de chaque côté.","Servez avec une salsa maison ou du commerce."]}]$j$::jsonb, $j$[]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('quesadilla', '', 1, 'Tortilla de farine', '1', (select id from public.aliments where code_fcen = 4049), 72),
  ('quesadilla', '', 2, 'Fromage cheddar fort râpé', '4 c. à soupe', (select id from public.aliments where code_fcen = 7735), 28.7),
  ('quesadilla', '', 3, 'Poulet cuit', '1/2 tasse', (select id from public.aliments where code_fcen = 567), 71.3),
  ('quesadilla', '', 4, 'Oignons verts', 'Au goût', null, null),
  ('quesadilla', '', 5, 'Épices, au choix', 'Au goût', null, null);

-- Overnight Oats à saveur de Tiramisu
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('tiramisu-overnight-oats', 'Overnight Oats à saveur de Tiramisu', '', 5, 0, 720, '2 portions', 2, $j$[{"section":"","items":["Dans un plat, mélangez tous les ingrédients sauf le yogourt.","Laissez reposer au moins 12 heures.","Au moment de servir, ajoutez le yogourt grec.","Garnir de fruits frais, au goût."]}]$j$::jsonb, $j$[]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('tiramisu-overnight-oats', '', 1, 'Yogourt grec protéiné', '300 g', (select id from public.aliments where code_fcen = 6979), 300),
  ('tiramisu-overnight-oats', '', 2, 'Gruau d''avoine', '1/2 tasse', (select id from public.aliments where code_fcen = 1462), 55.5),
  ('tiramisu-overnight-oats', '', 3, 'Lait d''avoine', '1/2 tasse', (select id from public.aliments where code_fcen = 7808), 125.1),
  ('tiramisu-overnight-oats', '', 4, 'Graines de chia', '2 c. à table', (select id from public.aliments where code_fcen = 2511), 21.6),
  ('tiramisu-overnight-oats', '', 5, 'Poudre de cacao', '1 c. à table', (select id from public.aliments where code_fcen = 4223), 5.4),
  ('tiramisu-overnight-oats', '', 6, 'Sirop d''érable sans sucre', '1 c. à thé', null, null),
  ('tiramisu-overnight-oats', '', 7, 'Extrait de vanille', '1 c. à thé', (select id from public.aliments where code_fcen = 216), 4.3);

-- Trempette 7 étages
insert into public.recettes (id, titre, image, preparation_min, cuisson_min, repos_min, rendement, portions, etapes, notes)
values ('trempette-7-etages', 'Trempette 7 étages', 'trempette-7-etages.webp', 30, 0, 0, '10 à 12 portions', 12, $j$[{"section":"","items":["Dans un petit bol, mélangez les haricots, les épices, l’ail et la sauce piquante jusqu’à ce qu’ils soient homogènes. Rectifiez l’assaisonnement. Mettez la pâte de haricots dans un plat de présentation d’environ 2 l (8 tasses).","Dans un bol, écrasez la chair des avocats au pilon jusqu’à ce qu’elle soit de la texture désirée. Ajoutez l’oignon, le piment, le jus de lime et une bonne pincée de sel. Mélangez pour bien incorporer le tout. Étalez le guacamole sur la pâte de haricots.","Dans un bol, mélangez la crème sure, le fromage à la crème et l’échalote, et ajoutez du poivre fraîchement moulu, au goût. Étalez le tout sur le guacamole.","Égouttez un peu la salsa à l’aide d’un tamis. Étendez-la sur le mélange de crème sure.","Étalez le fromage sur le dessus de la salsa. Faites de même avec les olives et la salade.","Garnissez le dessus de la trempette avec les dés de tomates et de poivron. En dernier lieu, ajoutez les oignons verts et un bon filet d’huile d’olive extra-vierge.","Servez la trempette avec des croustilles de tortilla ou des crudités."]}]$j$::jsonb, $j$[]$j$::jsonb);
insert into public.ingredients_recette (recette_id, section, position, nom, quantite, aliment_id, grammes) values
  ('trempette-7-etages', '', 1, 'Haricots frits', '1 conserve de 546 mL (19 oz)', (select id from public.aliments where code_fcen = 3314), 583.7),
  ('trempette-7-etages', '', 2, 'Poudre de chili', '1 c. à soupe', (select id from public.aliments where code_fcen = 177), 7.6),
  ('trempette-7-etages', '', 3, 'Paprika fumé', '2 c. à thé', (select id from public.aliments where code_fcen = 196), 4.2),
  ('trempette-7-etages', '', 4, 'Cumin moulu', '1 c. à thé', (select id from public.aliments where code_fcen = 182), 2.1),
  ('trempette-7-etages', '', 5, 'Gousse d''ail', '1', (select id from public.aliments where code_fcen = 2394), 3),
  ('trempette-7-etages', '', 6, 'Sel', 'Au goût', null, null),
  ('trempette-7-etages', '', 7, 'Avocats mûrs', '4', (select id from public.aliments where code_fcen = 1512), 544),
  ('trempette-7-etages', '', 8, 'Oignon râpé', '1/2', (select id from public.aliments where code_fcen = 2401), 55),
  ('trempette-7-etages', '', 9, 'Jus de lime', '1 c. à soupe', (select id from public.aliments where code_fcen = 1594), 15.6),
  ('trempette-7-etages', '', 10, 'Crème sure', '1 tasse', (select id from public.aliments where code_fcen = 139), 243),
  ('trempette-7-etages', '', 11, 'Fromage à la crème', '1/2 tasse', (select id from public.aliments where code_fcen = 28), 122.5),
  ('trempette-7-etages', '', 12, 'Échalote, hachée finement', '1/2', (select id from public.aliments where code_fcen = 2326), 15),
  ('trempette-7-etages', '', 13, 'Poivre', 'Au goût', null, null),
  ('trempette-7-etages', '', 14, 'Salsa du commerce', '1 2/3 tasse', (select id from public.aliments where code_fcen = 1025), 456.3),
  ('trempette-7-etages', '', 15, 'Fromage Tex-Mex', '1 tasse', (select id from public.aliments where code_fcen = 7041), 113),
  ('trempette-7-etages', '', 16, 'Poivron rouge', '1', (select id from public.aliments where code_fcen = 2484), 119),
  ('trempette-7-etages', '', 17, 'Tomates italiennes, épépinées et coupées en petits dés', '2', (select id from public.aliments where code_fcen = 2460), 124),
  ('trempette-7-etages', '', 18, 'Oignons verts, ciselés', '2', (select id from public.aliments where code_fcen = 2144), 30),
  ('trempette-7-etages', '', 19, 'Huile d''olive extra vierge', 'Au goût', null, null);

-- Le journal peut maintenant pointer vers une VRAIE recette : clé étrangère.
-- RESTRICT : impossible de supprimer une recette déjà consommée dans un journal.
alter table public.journal
  add constraint journal_recette_fk foreign key (recette_id)
  references public.recettes(id) on delete restrict on update cascade;

commit;

-- Contrôle : 9 recettes, 101 ingrédients, dont 77 reliés à un aliment.
select
  (select count(*) from public.recettes) as recettes,
  (select count(*) from public.ingredients_recette) as ingredients,
  (select count(*) from public.ingredients_recette where aliment_id is not null) as relies;
