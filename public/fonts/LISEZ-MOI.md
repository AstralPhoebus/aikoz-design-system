# Polices de marque

Un design system **déclare** la police, il ne la **livre** pas.

Les `@font-face` sont versionnés (`.storybook/fonts.css`), les **binaires ne le
sont pas** : ce dépôt est public, et Gotham comme la police Extime sont sous
licence. La charte ADP est explicite — « You must purchase the Gotham typeface
to obtain the user licence » — et la police Extime se récupère sur le brand
center Extime.

## Conséquence

Sans les fichiers, l'aperçu rend dans les **substituts que les chartes
elles-mêmes désignent** : Century Gothic pour ADP, Arial pour Extime. Ce n'est
pas un défaut, c'est ce que verra un poste sans la licence.

## Pour rendre avec les vraies polices, en local

Déposer les fichiers `.woff2` et `.woff` ici :

    public/fonts/gotham/     Gotham-Book.woff2, Gotham-Medium.woff2, …
    public/fonts/extime/     Extime-Thin.woff2, Extime-Light.woff2, …

Les noms attendus sont ceux de `.storybook/fonts.css`. Rien d'autre à faire :
le dossier est ignoré par git, la feuille est déjà chargée.
