# Especificações Técnicas dos Estilos

---

## 1. GLASSMORPHISM

### Características
- Transparência com blur de fundo
- Sensação de profundidade e flutuação
- Bordas semi-transparentes
- Fundo com gradiente suave (obrigatório para o efeito funcionar)

### Regras CSS
```css
backdrop-filter: blur(10px); /* range: 10px a 40px */
background: rgba(255, 255, 255, 0.15); /* range: 0.1 a 0.3 */
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
border-radius: 12px;
```

### Componentes típicos
- Cards flutuantes sobre imagem ou gradiente
- Modais translúcidos
- Navbar com blur
- Sidebars com transparência

### Evitar
- Usar sobre fundo branco liso (efeito some)
- Camadas de glass sobre glass
- Texto sem contraste suficiente

---

## 2. SKEUMORPHISM

### Características
- Simulação de objetos físicos reais
- Texturas (couro, madeira, metal, papel)
- Iluminação direcional realista
- Botões que parecem pressionáveis

### Regras CSS
```css
/* Botão físico */
background: linear-gradient(to bottom, #e8e8e8, #c0c0c0);
box-shadow:
  0 1px 0 rgba(255,255,255,0.8) inset,
  0 -1px 0 rgba(0,0,0,0.2) inset,
  0 3px 6px rgba(0,0,0,0.3);
border: 1px solid #999;
border-radius: 6px;

/* Estado pressionado */
box-shadow:
  0 1px 3px rgba(0,0,0,0.3) inset;
transform: translateY(1px);
```

### Componentes típicos
- Botões com relevo
- Knobs e sliders estilo hardware
- Interfaces de áudio/instrumento
- Wallets, cadernos, calculadoras

### Evitar
- Aplicar em dashboards modernos de dados
- Combinar com flat design
- Exagerar a ponto de virar kitsch

---

## 3. NEOBRUTALISM

### Características
- Alto contraste (geralmente preto + cor vibrante)
- Bordas pretas grossas e duras
- Sombras offset (não difusas)
- Tipografia pesada e assertiva
- Estética propositalmente "crua" e sem polimento

### Regras CSS
```css
/* Card neobrutalist */
border: 2px solid #000; /* ou 3px/4px */
box-shadow: 4px 4px 0px #000; /* offset sólido, sem blur */
background: #FFE566; /* cor sólida vibrante */
border-radius: 0; /* ou máximo 4px */

/* Botão */
border: 2px solid #000;
box-shadow: 3px 3px 0 #000;
font-weight: 800;
text-transform: uppercase;

/* Hover do botão */
transform: translate(2px, 2px);
box-shadow: 1px 1px 0 #000;
```

### Paleta típica
- Preto #000 + amarelo #FFE566
- Preto #000 + coral #FF6B6B
- Preto #000 + verde #00FF87
- Branco #FFF como fundo

### Componentes típicos
- Botões com borda dura e sombra offset
- Cards chapados com cor sólida
- Layouts assimétricos e intencionais
- Tags e badges com borda preta

### Evitar
- Qualquer gradiente
- Sombras difusas (blur)
- border-radius alto
- Cores dessaturadas

---

## 4. CLAYMORPHISM

### Características
- Aparência "fofa" e tridimensional
- Formas muito arredondadas (infladas)
- Sombras coloridas e difusas
- Cores pastel saturadas
- Sensação de plasticina ou clay

### Regras CSS
```css
/* Card clay */
border-radius: 20px; /* range: 16px a 30px */
background: #B5E8FF; /* pastel saturado */
box-shadow:
  inset 0 -6px 0 rgba(0,0,0,0.12),
  0 12px 32px rgba(181, 232, 255, 0.4);
border: none;

/* Elemento inflado */
padding: 24px 28px;
filter: drop-shadow(0 8px 16px rgba(0,0,0,0.08));
```

### Paleta típica
- Azul baby #B5E8FF
- Rosa #FFB5E8
- Verde menta #B5FFD9
- Lavanda #D5B5FF
- Amarelo #FFF5B5

### Componentes típicos
- Botões gordos e arredondados
- Cards com sombra interna e externa
- Ícones 3D inflados
- Avatares e ilustrações

### Evitar
- Cores escuras ou dessaturadas
- Bordas duras
- Sombras pretas sem blur
- Elementos angulares

---

## 5. MINIMALISM

### Características
- Simplicidade extrema
- Foco total no conteúdo
- Espaço em branco como elemento de design
- Tipografia como protagonista

### Regras CSS
```css
/* Layout base */
background: #FFFFFF;
color: #111111;
font-family: 'Inter', sans-serif;
line-height: 1.6;
max-width: 680px;
margin: 0 auto;
padding: 48px 24px;

/* Botão minimal */
background: #111;
color: #fff;
border: none;
padding: 12px 24px;
border-radius: 4px;
font-size: 14px;
letter-spacing: 0.02em;

/* Card minimal */
border: 1px solid #E5E5E5;
border-radius: 8px;
padding: 24px;
background: #fff;
```

### Regras não-visuais (igualmente importantes)
- Máximo 2 fontes no projeto inteiro
- Máximo 3 cores (primária, secundária, neutro)
- Cada elemento justifica sua existência
- Grid consistente em toda a interface

### Evitar
- Ícones decorativos sem função
- Animações chamativas
- Mais de 3 pesos de fonte
- Qualquer elemento que não carregue informação

---

## 6. LIQUID GLASS

### Características
- Superfícies fluidas com reflexo dinâmico
- Blur + brilho especular
- Gradientes iridescentes
- Sensação de material premium e orgânico
- Animações suaves (opcional mas recomendado)

### Regras CSS
```css
/* Card liquid glass */
background: linear-gradient(
  135deg,
  rgba(255,255,255,0.4) 0%,
  rgba(255,255,255,0.1) 100%
);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255,255,255,0.5);
border-radius: 16px;
box-shadow:
  0 8px 32px rgba(0,0,0,0.12),
  inset 0 1px 0 rgba(255,255,255,0.6),
  inset 0 -1px 0 rgba(255,255,255,0.1);

/* Efeito de brilho dinâmico */
background: linear-gradient(
  105deg,
  rgba(255,255,255,0.6) 0%,
  rgba(120,180,255,0.2) 30%,
  rgba(255,120,200,0.2) 60%,
  rgba(255,255,255,0.4) 100%
);

/* Animação opcional */
@keyframes liquidShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
animation: liquidShift 6s ease infinite;
background-size: 200% 200%;
```

### Componentes típicos
- Botões com efeito de luz interna
- Cards com gradiente iridescente
- Fundos animados
- Painéis premium (fintech, luxury, apps Apple-style)

### Evitar
- Interfaces com muito conteúdo (o efeito compete com o texto)
- Usar sobre fundo branco liso
- Excesso de elementos com o mesmo efeito
- Combinar com neobrutalism ou skeumorphism
