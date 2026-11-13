# Genera dict/thes_es.json y dict/thes_ca.json a partir de los tesauros MyThes (LibreOffice) + antónimos propios.
import re, json, sys, os
SRC = sys.argv[1]            # carpeta con el clon de LibreOffice/dictionaries (es, ca)
OUT = os.path.join(os.path.dirname(__file__), '..', 'dict')

CURATED = """
alto,bajo|alt,baix
grande,pequeño|gran,petit
largo,corto|llarg,curt
ancho,estrecho|ample,estret
grueso,delgado|gruixut,prim
pesado,ligero|pesant,lleuger
fuerte,débil|fort,feble
duro,blando|dur,tou
rápido,lento|ràpid,lent
nuevo,viejo|nou,vell
joven,anciano|jove,ancià
bueno,malo|bo,dolent
bonito,feo|bonic,lleig
guapo,feo|guapo,lleig
limpio,sucio|net,brut
caliente,frío|calent,fred
cálido,fresco|càlid,fresc
seco,mojado|sec,mullat
lleno,vacío|ple,buit
rico,pobre|ric,pobre
barato,caro|barat,car
fácil,difícil|fàcil,difícil
claro,oscuro|clar,fosc
luminoso,sombrío|lluminós,ombrívol
alegre,triste|alegre,trist
feliz,infeliz|feliç,infeliç
feliz,desgraciado|feliç,desgraciat
contento,descontento|content,descontent
sano,enfermo|sa,malalt
vivo,muerto|viu,mort
abierto,cerrado|obert,tancat
cerca,lejos|a prop,lluny
dentro,fuera|dins,fora
arriba,abajo|amunt,avall
delante,detrás|davant,darrere
antes,después|abans,després
temprano,tarde|d'hora,tard
siempre,nunca|sempre,mai
todo,nada|tot,res
mucho,poco|molt,poc
más,menos|més,menys
mayor,menor|major,menor
primero,último|primer,últim
principio,fin|principi,final
comienzo,final|començament,final
empezar,terminar|començar,acabar
comenzar,acabar|començar,finalitzar
abrir,cerrar|obrir,tancar
subir,bajar|pujar,baixar
entrar,salir|entrar,sortir
llegar,partir|arribar,marxar
ir,venir|anar,venir
comprar,vender|comprar,vendre
dar,recibir|donar,rebre
ganar,perder|guanyar,perdre
amar,odiar|estimar,odiar
aceptar,rechazar|acceptar,rebutjar
permitir,prohibir|permetre,prohibir
ayudar,estorbar|ajudar,destorbar
construir,destruir|construir,destruir
crear,destruir|crear,destruir
recordar,olvidar|recordar,oblidar
encender,apagar|encendre,apagar
llenar,vaciar|omplir,buidar
juntar,separar|ajuntar,separar
unir,separar|unir,separar
atar,desatar|lligar,deslligar
hablar,callar|parlar,callar
reír,llorar|riure,plorar
dormir,despertar|dormir,despertar
levantar,acostar|aixecar,gitar
verdad,mentira|veritat,mentida
verdadero,falso|veritable,fals
cierto,falso|cert,fals
correcto,incorrecto|correcte,incorrecte
posible,imposible|possible,impossible
legal,ilegal|legal,il·legal
justo,injusto|just,injust
honesto,deshonesto|honest,deshonest
amable,grosero|amable,groller
cortés,descortés|cortès,descortès
valiente,cobarde|valent,covard
sabio,ignorante|savi,ignorant
listo,tonto|llest,tonto
inteligente,estúpido|intel·ligent,estúpid
paz,guerra|pau,guerra
amigo,enemigo|amic,enemic
amor,odio|amor,odi
vida,muerte|vida,mort
día,noche|dia,nit
luz,oscuridad|llum,foscor
sol,luna|sol,lluna
verano,invierno|estiu,hivern
norte,sur|nord,sud
este,oeste|est,oest
derecha,izquierda|dreta,esquerra
hombre,mujer|home,dona
padre,madre|pare,mare
cielo,tierra|cel,terra
cielo,infierno|cel,infern
ángel,demonio|àngel,dimoni
éxito,fracaso|èxit,fracàs
victoria,derrota|victòria,derrota
ventaja,desventaja|avantatge,desavantatge
ventaja,inconveniente|avantatge,inconvenient
beneficio,perjuicio|benefici,perjudici
presente,ausente|present,absent
presente,pasado|present,passat
pasado,futuro|passat,futur
mayoría,minoría|majoria,minoria
público,privado|públic,privat
interior,exterior|interior,exterior
superior,inferior|superior,inferior
máximo,mínimo|màxim,mínim
positivo,negativo|positiu,negatiu
activo,pasivo|actiu,passiu
visible,invisible|visible,invisible
mejor,peor|millor,pitjor
mejorar,empeorar|millorar,empitjorar
aumentar,disminuir|augmentar,disminuir
crecer,decrecer|créixer,decréixer
ensanchar,estrechar|eixamplar,estrènyer
alargar,acortar|allargar,escurçar
acelerar,frenar|accelerar,frenar
liso,rugoso|llis,rugós
suave,áspero|suau,aspre
dulce,amargo|dolç,amarg
dulce,salado|dolç,salat
sabroso,insípido|saborós,insípid
fino,grueso|fi,gruixut
profundo,superficial|profund,superficial
cóncavo,convexo|còncau,convex
recto,curvo|recte,corb
redondo,cuadrado|rodó,quadrat
ruidoso,silencioso|sorollós,silenciós
ruido,silencio|soroll,silenci
encima,debajo|a sobre,a sota
sobre,bajo|sobre,sota
libre,preso|lliure,presoner
libertad,esclavitud|llibertat,esclavitud
riqueza,pobreza|riquesa,pobresa
salud,enfermedad|salut,malaltia
alegría,tristeza|alegria,tristesa
esperanza,desesperación|esperança,desesperació
miedo,valor|por,valor
calma,nervios|calma,nervis
tranquilo,nervioso|tranquil,nerviós
tranquilo,agitado|tranquil,agitat
sencillo,complicado|senzill,complicat
simple,complejo|simple,complex
claro,confuso|clar,confús
simpático,antipático|simpàtic,antipàtic
agradable,desagradable|agradable,desagradable
fiel,infiel|fidel,infidel
generoso,tacaño|generós,avar
avaro,generoso|avar,generós
humilde,orgulloso|humil,orgullós
modesto,vanidoso|modest,vanitós
activo,perezoso|actiu,mandrós
trabajador,vago|treballador,gandul
trabajo,descanso|treball,descans
trabajar,descansar|treballar,descansar
entrada,salida|entrada,sortida
ida,vuelta|anada,tornada
subida,bajada|pujada,baixada
llegada,partida|arribada,sortida
nacer,morir|néixer,morir
encontrar,perder|trobar,perdre
esconder,mostrar|amagar,mostrar
ocultar,revelar|ocultar,revelar
afirmar,negar|afirmar,negar
preguntar,responder|preguntar,respondre
vencer,rendirse|vèncer,rendir-se
atacar,defender|atacar,defensar
acusar,defender|acusar,defensar
culpable,inocente|culpable,innocent
real,imaginario|real,imaginari
natural,artificial|natural,artificial
antiguo,moderno|antic,modern
antiguo,actual|antic,actual
temporal,permanente|temporal,permanent
breve,duradero|breu,durador
frecuente,raro|freqüent,rar
común,raro|comú,estrany
normal,anormal|normal,anormal
ordenado,desordenado|ordenat,desordenat
orden,desorden|ordre,desordre
seguro,peligroso|segur,perillós
seguridad,peligro|seguretat,perill
duda,certeza|dubte,certesa
fuerza,debilidad|força,debilitat
sólido,líquido|sòlid,líquid
enorme,diminuto|enorme,diminut
gigante,enano|gegant,nan
mojar,secar|mullar,assecar
calentar,enfriar|escalfar,refredar
cercano,lejano|proper,llunyà
próximo,lejano|proper,llunyà
""".strip().splitlines()

def decode(raw):
    try: return raw.decode('utf-8')
    except UnicodeDecodeError:
        return raw.decode('cp1252', errors='replace')

ANT = re.compile(r'\s*\((?:ant[^)]{0,8}nim[^)]*|ant)\)\s*$', re.I)
QUAL = re.compile(r'\s*\([^)]*\)\s*')

def parse(path, enc):
    raw = open(path, 'rb').read().split(b'\n')
    lines = [(l.decode('latin-1') if enc == 'latin-1' else decode(l)).rstrip('\r') for l in raw]
    i = 1; ent = {}
    while i < len(lines):
        m = re.match(r'^(.+)\|(\d+)$', lines[i])
        if not m: i += 1; continue
        w, n = m.group(1).strip().lower(), int(m.group(2)); i += 1
        groups = []
        for _ in range(n):
            if i >= len(lines): break
            parts = lines[i].split('|'); i += 1
            pos = parts[0].strip('() ') if parts[0].startswith('(') else ''
            syn, ant = [], []
            for p in parts[1:]:
                p = p.strip()
                if not p: continue
                isant = bool(ANT.search(p))
                p = ANT.sub('', p) if isant else p
                if '�' in p or 'ï¿½' in p: continue
                p = QUAL.sub(' ', p).strip()
                if not p or p == w: continue
                (ant if isant else syn).append(p)
            if syn or ant: groups.append([pos, '|'.join(dict.fromkeys(syn)), '|'.join(dict.fromkeys(ant))])
        if groups: ent.setdefault(w, []).extend(groups)
    return ent

def curated(idx):
    x = {}
    for ln in CURATED:
        sides = ln.split('|')[idx].split(',')
        a, b = sides[0].strip(), sides[1].strip()
        x.setdefault(a, []).append(b); x.setdefault(b, []).append(a)
    return {k: '|'.join(dict.fromkeys(v)) for k, v in x.items()}

for lang, path, enc, idx in [] if os.environ.get('ONLY_NEW') else [('es', os.path.join(SRC, 'es/th_es_v2.dat'), 'latin-1', 0),
                             ('ca', os.path.join(SRC, 'ca/dictionaries/th_ca_ES_v3.dat'), 'utf-8', 1)]:
    e = parse(path, enc); x = curated(idx)
    n_ant = sum(1 for g in e.values() for r in g if r[2])
    out = os.path.join(OUT, f'thes_{lang}.json')
    json.dump({'e': e, 'x': x}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(lang, 'entradas', len(e), 'grupos con antónimos', n_ant, 'antónimos propios', len(x), os.path.getsize(out) // 1024, 'KB')

CURATED_EN = """big,small
large,small
tall,short
long,short
wide,narrow
thick,thin
heavy,light
strong,weak
hard,soft
fast,slow
quick,slow
new,old
young,old
good,bad
beautiful,ugly
pretty,ugly
clean,dirty
hot,cold
warm,cool
dry,wet
full,empty
rich,poor
cheap,expensive
easy,difficult
simple,complex
light,dark
bright,dim
happy,sad
glad,sorry
cheerful,gloomy
healthy,sick
alive,dead
open,closed
near,far
close,distant
inside,outside
above,below
up,down
front,back
before,after
early,late
always,never
all,none
everything,nothing
everyone,no one
many,few
much,little
more,less
most,least
first,last
begin,end
start,finish
open,close
rise,fall
raise,lower
ascend,descend
enter,exit
arrive,depart
come,go
buy,sell
give,take
give,receive
win,lose
love,hate
like,dislike
accept,reject
allow,forbid
permit,prohibit
help,hinder
build,destroy
create,destroy
remember,forget
light,extinguish
fill,empty
join,separate
unite,divide
tie,untie
speak,listen
laugh,cry
sleep,wake
truth,lie
true,false
right,wrong
correct,incorrect
possible,impossible
legal,illegal
fair,unfair
honest,dishonest
kind,cruel
polite,rude
brave,cowardly
wise,foolish
clever,stupid
smart,dumb
peace,war
friend,enemy
love,hatred
life,death
day,night
light,darkness
summer,winter
north,south
east,west
left,right
man,woman
male,female
father,mother
son,daughter
brother,sister
king,queen
heaven,hell
angel,demon
success,failure
victory,defeat
advantage,disadvantage
benefit,harm
present,absent
past,future
majority,minority
public,private
interior,exterior
superior,inferior
maximum,minimum
positive,negative
active,passive
visible,invisible
better,worse
improve,worsen
increase,decrease
grow,shrink
expand,contract
lengthen,shorten
accelerate,decelerate
smooth,rough
sweet,sour
sweet,bitter
shallow,deep
straight,crooked
loud,quiet
noise,silence
free,captive
freedom,slavery
wealth,poverty
health,illness
joy,sorrow
hope,despair
fear,courage
calm,nervous
calm,agitated
generous,stingy
humble,proud
modest,arrogant
lazy,industrious
work,rest
entrance,exit
departure,arrival
birth,death
find,lose
hide,reveal
conceal,reveal
affirm,deny
ask,answer
victory,loss
attack,defend
guilty,innocent
real,imaginary
natural,artificial
ancient,modern
temporary,permanent
frequent,rare
common,rare
normal,abnormal
tidy,messy
order,chaos
safe,dangerous
safety,danger
doubt,certainty
strength,weakness
solid,liquid
huge,tiny
giant,dwarf
wet,dry
heat,cool
brave,timid
lucky,unlucky
generous,selfish
loyal,disloyal
guilty,innocent
sharp,blunt
sane,insane
awake,asleep
remain,leave
push,pull
throw,catch
lend,borrow
rent,own
borrow,lend
admit,deny
agree,disagree
approve,disapprove
arrive,leave
attract,repel
build,demolish
cause,prevent
connect,disconnect
cooperate,compete
create,eliminate
dark,fair
deep,high
dense,sparse
encourage,discourage
fiction,fact
fortunate,unfortunate
gain,loss
hero,villain
innocent,guilty
inhale,exhale
intelligent,ignorant
joy,misery
major,minor
mercy,cruelty
optimist,pessimist
pleasure,pain
praise,criticize
pride,shame
profit,loss
pure,impure
rapid,gradual
rough,gentle
satisfied,dissatisfied
scatter,gather
sink,float
stiff,flexible
succeed,fail
sunny,cloudy
tame,wild
tight,loose
trust,distrust
urban,rural
victory,surrender
vacant,occupied
wake,sleep
weak,powerful
wild,domestic
youth,age""".strip().splitlines()
CURATED_FR = """grand,petit
haut,bas
long,court
large,étroit
épais,mince
gros,maigre
lourd,léger
fort,faible
dur,mou
rapide,lent
nouveau,vieux
neuf,usé
jeune,vieux
bon,mauvais
beau,laid
joli,laid
propre,sale
chaud,froid
sec,humide
plein,vide
riche,pauvre
cher,bon marché
facile,difficile
simple,compliqué
clair,sombre
clair,obscur
lumineux,sombre
heureux,malheureux
gai,triste
content,mécontent
sain,malade
vivant,mort
ouvert,fermé
près,loin
proche,lointain
dedans,dehors
dessus,dessous
haut,bas
devant,derrière
avant,après
tôt,tard
toujours,jamais
tout,rien
beaucoup,peu
plus,moins
plus,minimum
premier,dernier
début,fin
commencement,fin
commencer,finir
commencer,terminer
ouvrir,fermer
monter,descendre
lever,baisser
entrer,sortir
arriver,partir
venir,aller
acheter,vendre
donner,recevoir
donner,prendre
gagner,perdre
aimer,détester
aimer,haïr
accepter,refuser
accepter,rejeter
permettre,interdire
autoriser,interdire
aider,gêner
construire,détruire
créer,détruire
se souvenir,oublier
allumer,éteindre
remplir,vider
joindre,séparer
unir,diviser
attacher,détacher
parler,se taire
rire,pleurer
dormir,veiller
dormir,s'éveiller
vérité,mensonge
vrai,faux
juste,injuste
correct,incorrect
possible,impossible
légal,illégal
honnête,malhonnête
aimable,désagréable
poli,impoli
courageux,lâche
brave,lâche
sage,fou
intelligent,stupide
malin,bête
paix,guerre
ami,ennemi
amour,haine
vie,mort
jour,nuit
lumière,obscurité
lumière,ténèbres
été,hiver
nord,sud
est,ouest
droite,gauche
homme,femme
mâle,femelle
père,mère
fils,fille
frère,sœur
roi,reine
ciel,terre
ciel,enfer
ange,démon
succès,échec
victoire,défaite
avantage,inconvénient
bénéfice,perte
présent,absent
présent,passé
passé,futur
majorité,minorité
public,privé
intérieur,extérieur
supérieur,inférieur
maximum,minimum
positif,négatif
actif,passif
visible,invisible
meilleur,pire
améliorer,détériorer
augmenter,diminuer
croître,décroître
élargir,rétrécir
allonger,raccourcir
accélérer,ralentir
lisse,rugueux
doux,rude
doux,amer
sucré,salé
profond,superficiel
droit,courbe
bruyant,silencieux
bruit,silence
libre,prisonnier
liberté,esclavage
richesse,pauvreté
santé,maladie
joie,tristesse
espoir,désespoir
peur,courage
calme,nerveux
calme,agité
généreux,avare
humble,orgueilleux
modeste,vaniteux
paresseux,travailleur
travail,repos
entrée,sortie
départ,arrivée
naissance,mort
trouver,perdre
cacher,montrer
cacher,révéler
affirmer,nier
demander,répondre
vaincre,se rendre
attaquer,défendre
coupable,innocent
réel,imaginaire
naturel,artificiel
ancien,moderne
temporaire,permanent
fréquent,rare
commun,rare
normal,anormal
ordonné,désordonné
ordre,désordre
sûr,dangereux
sécurité,danger
doute,certitude
force,faiblesse
solide,liquide
énorme,minuscule
géant,nain
mouiller,sécher
chauffer,refroidir
chaleur,froid
réussir,échouer
fidèle,infidèle
loyal,déloyal
chanceux,malchanceux
aigu,émoussé
éveillé,endormi
rester,partir
pousser,tirer
lancer,attraper
prêter,emprunter
admettre,nier
approuver,désapprouver
attirer,repousser
encourager,décourager
rassembler,disperser
couler,flotter
rural,urbain
sauvage,domestique
héros,méchant
plaisir,douleur
louer,critiquer
fierté,honte
pur,impur
rapide,progressif""".strip().splitlines()
EN_TAG = re.compile(r'\s*\(([^)]*)\)\s*$')

def parse_tagged(path, mode):
    # mode 'en': WordNet-style con etiquetas (antonym), (similar term), (generic term)...; mode 'fr': sin etiquetas
    raw = open(path, 'rb').read().decode('utf-8').split('\n')
    i = 1; ent = {}
    while i < len(raw):
        m = re.match(r'^(.+)\|(\d+)\r?$', raw[i])
        if not m: i += 1; continue
        w, n = m.group(1).strip().lower(), int(m.group(2)); i += 1
        groups = []
        for _ in range(n):
            if i >= len(raw): break
            parts = raw[i].rstrip('\r').split('|'); i += 1
            pos = parts[0].strip('() ') if parts[0].startswith('(') else ''
            syn, ant = [], []
            for p in parts[1:]:
                p = p.strip()
                if not p: continue
                tag = ''
                if mode == 'en':
                    t = EN_TAG.search(p)
                    if t: tag = t.group(1).lower(); p = p[:t.start()].strip()
                    if tag in ('generic term', 'related term', 'usage domain', 'part of', 'a part of'): continue
                    if tag and tag not in ('antonym', 'similar term'): continue
                p = QUAL.sub(' ', p).strip()
                if not p or p.lower() == w or len(p.split()) > 3: continue
                (ant if tag == 'antonym' else syn).append(p)
            if syn or ant: groups.append([pos, '|'.join(dict.fromkeys(syn[:25])), '|'.join(dict.fromkeys(ant[:12]))])
        if groups: ent.setdefault(w, []).extend(groups[:6])
    return ent

def curated_list(lines):
    x = {}
    for ln in lines:
        a, b = [t.strip() for t in ln.split(',')]
        x.setdefault(a, []).append(b); x.setdefault(b, []).append(a)
    return {k: '|'.join(dict.fromkeys(v)) for k, v in x.items()}

for lang, path, mode, cur in [('en', os.path.join(SRC, 'en/th_en_US_v2.dat'), 'en', CURATED_EN),
                              ('fr', os.path.join(SRC, 'fr_FR/dictionaries/thes_fr.dat'), 'fr', CURATED_FR)]:
    e = parse_tagged(path, mode); x = curated_list(cur)
    n_ant = sum(1 for g in e.values() for r in g if r[2])
    out = os.path.join(OUT, f'thes_{lang}.json')
    json.dump({'e': e, 'x': x}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(lang, 'entradas', len(e), 'grupos con antónimos', n_ant, 'antónimos propios', len(x), os.path.getsize(out) // 1024, 'KB')
