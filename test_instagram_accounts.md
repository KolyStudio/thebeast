# Test des comptes Instagram avec les nouvelles méthodes d'authentification

## Test de l'onglet Email (méthode actuelle améliorée)

### Format attendu : `pseudo:pass:email:email_pass:challenge_pass`

Exemples de test :
```
testuser1:password123:test1@example.com:emailpass123:challengepass123
testuser2:password456:test2@example.com:emailpass456:challengepass456
testuser3:password789:test3@example.com:emailpass789:challengepass789
```

### Champs qui doivent être enregistrés :
- `username`: testuser1, testuser2, testuser3
- `password`: password123, password456, password789
- `challenge_mail`: test1@example.com, test2@example.com, test3@example.com
- `email_password`: emailpass123, emailpass456, emailpass789
- `challenge_password`: challengepass123, challengepass456, challengepass789
- `auth_method`: "email" (automatiquement ajouté)
- `statut`: "nouveau"

## Test de l'onglet 2FA (nouvelle méthode)

### Format attendu : `pseudo:password:code_2fa`

Exemples de test :
```
user2fa1:mypassword1:ABCD1234EFGH5678
user2fa2:mypassword2:IJKL9012MNOP3456
user2fa3:mypassword3:QRST7890UVWX1234
```

### Champs qui doivent être enregistrés :
- `username`: user2fa1, user2fa2, user2fa3
- `password`: mypassword1, mypassword2, mypassword3
- `totp_seed`: ABCD1234EFGH5678, IJKL9012MNOP3456, QRST7890UVWX1234
- `auth_method`: "totp" (automatiquement ajouté)
- `statut`: "nouveau"

## Instructions de test

1. Ouvrir l'application sur http://localhost:5174/instagram
2. Cliquer sur le bouton "+" pour ouvrir la popup d'ajout de comptes
3. Vérifier que les deux onglets "Email" et "2FA" sont visibles
4. Tester l'onglet Email avec les exemples ci-dessus
5. Tester l'onglet 2FA avec les exemples ci-dessus
6. Vérifier que les données sont correctement enregistrées en base de données
7. Vérifier que les champs `auth_method` et `totp_seed` sont correctement remplis

## Vérifications attendues

- [ ] Les onglets s'affichent correctement avec le style DaisyUI
- [ ] Le changement d'onglet vide le textarea
- [ ] Les placeholders changent selon l'onglet sélectionné
- [ ] Les descriptions de format sont correctes pour chaque onglet
- [ ] Les comptes Email sont créés avec `auth_method = "email"`
- [ ] Les comptes 2FA sont créés avec `auth_method = "totp"`
- [ ] Le champ `totp_seed` est rempli pour les comptes 2FA
- [ ] Les messages d'erreur sont adaptés au format sélectionné
