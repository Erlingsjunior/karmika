# Bestiário de Karmika — ficha para o design (04/11/2026)

77 criaturas no jogo hoje. Gerado do código (enemies.ts) e do bestiário de 26/10, com as criaturas novas.

**Como ler cada ficha:**
- **Tamanho:** escala no jogo, em que 1 = um humano de 1,8 m (o herói). O desenho tem que ler bem de cima, na câmera isométrica: silhueta clara e partes grandes.
- **Vida e dano:** os números do nível dele, para dar o peso visual (um bicho de 10 mil de vida precisa parecer muito maior que um de 300).
- **Animações:** o mínimo que o modelo precisa ter. O "preparo do golpe" é obrigatório e bem legível: é como o jogador sabe a hora de sair.
- **Hoje no jogo:** se já tem modelo de arte ou se ainda é o corpo provisório feito em código.
- Estilo do jogo: pixel art 3D não granulado, cores fortes, efeitos de brilho e aura bem feitos.

## Feras

### Coiote (`coyote`)
- **Nível 1** · vida 177 · golpe base 6 · **tamanho ×0.8**
- **Quem é:** Pequeno e rápido. Morde e recua.
- **Onde vive:** Territórios: Bosque de Lithendel, Colinas do Sul, Planalto de Askavik, Sopé de Brasaforja, Vale de Karmika; Biomas: Campos, Costa, Florestas, Pedregais, Ruínas; Masmorras: Covil do Escorpião-Rei.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Cervo (`deer`)
- **Nível 1** · vida 114 · golpe base 0 · **tamanho ×1**
- **Quem é:** Cervo. Não briga, foge.
- **Traços:** Pacífico
- **Onde vive:** Territórios: Bosque de Lithendel; Biomas: Campos, Florestas.
- **Animações:** parado (pastando); andar; correr (fuga); levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Ratazana Rubra (`rat`)
- **Nível 1** · vida 83 · golpe base 4 · **tamanho ×1**
- **Quem é:** A Ratazana Rubra das tocas e criptas. Uma é nada; vinte é problema.
- **Onde vive:** Territórios: Bosque de Lithendel, Charcos do Oeste, Costa do Vapor e da Graxa, Minas de Cinzalto, Sopé de Brasaforja, Vale de Karmika; Biomas: Campos, Costa, Neve, Pântanos, Ruínas; Masmorras: Arquivo dos Mapas, Galerias de Brasaforja, Mausoléu dos Esquecidos, Raízes de Lithendel, Toca das Ratazanas Rubras.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Javali (`boar`)
- **Nível 2** · vida 390 · golpe base 10 · **tamanho ×1**
- **Quem é:** Javali de presas curvas. Investe em linha reta: saia da frente.
- **Onde vive:** Territórios: Bosques de Lundr, Charcos do Oeste, Planalto de Askavik, Selva Licantropa, Sopé de Brasaforja, Vale de Karmika; Biomas: Campos, Costa, Florestas, Pântanos, Selva.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Lobo (`wolf`)
- **Nível 2** · vida 302 · golpe base 9 · **tamanho ×1**
- **Quem é:** O lobo cinzento das matas. Caça em dupla e cerca pelos lados.
- **Onde vive:** Territórios: Bosques de Lundr, Florestas Élficas, Mata do Leste, Passo de Midvangr, Planalto de Askavik, Selva Licantropa; Biomas: Campos, Florestas, Mata Encantada, Pedregais, Selva; Masmorras: Covil do Uivo Antigo, Toca do Covil dos Lobos.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Lobo Gélido (`frostwolf`)
- **Nível 3** · vida 416 · golpe base 11 · **tamanho ×1.1**
- **Quem é:** Lobo de pelagem branca das montanhas: mais forte e mais frio.
- **Onde vive:** Territórios: Cordilheira do Norte, Montanha Viking, Passo de Midvangr; Biomas: Neve, Selva; Masmorras: Fenda do Cume Gelado, Gruta do Fiorde, Salão de Hrímnir.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Lobo-Rei Alfa (`alpha`)
- **Nível 10** · vida 1352 · golpe base 18 · **tamanho ×1.7** · **ELITE / CHEFE**
- **Quem é:** O Lobo-Rei do Covil dos Lobos: uiva e a alcateia vem.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Uivo do Rei, A Alcateia, Bote do Rei
- **Onde vive:** Dono de: Covil dos Lobos.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Uivo do Rei; magia: A Alcateia; magia: Bote do Rei
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Urso Pardo (`bear`)
- **Nível 12** · vida 1664 · golpe base 26 · **tamanho ×1.25**
- **Quem é:** Urso pardo. Só ataca se você chega perto; de pé nas patas de trás, desce as duas garras.
- **Onde vive:** Territórios: Bosques de Lundr, Cordilheira do Norte, Mata do Leste, Passo de Midvangr, Planalto de Askavik.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Lobisomem (`werewolf`)
- **Nível 16** · vida 2184 · golpe base 30 · **tamanho ×1.12**
- **Quem é:** Lobisomem: garras, salto e fome de lua.
- **Onde vive:** Territórios: Selva Licantropa; Biomas: Selva; Masmorras: Covil do Uivo Antigo, Toca do Covil dos Lobos.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'beast') — precisa de modelo de arte

### Urso das Cavernas (`cavebear`)
- **Nível 30** · vida 3224 · golpe base 40 · **tamanho ×1.6** · **ELITE / CHEFE**
- **Quem é:** O urso das cavernas do Norte: rugido que deixa lento e patada que racha o chão.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Rugido da Caverna, Patada
- **Onde vive:** Dono de: Hrimgard.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Rugido da Caverna; magia: Patada
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

## Mortos e Ossos

### Morcego da Noite (`bat`)
- **Nível 9** · vida 234 · golpe base 10 · **tamanho ×0.9**
- **Quem é:** Morcego da noite; vem em revoada.
- **Traços:** Voa
- **Onde vive:** Territórios: Colina Vampírica; Biomas: Terras Malditas; Masmorras: Arquivo dos Mapas, Caverna da Garganta, Cripta de Hemara, Cripta do Conde, Galerias Proibidas, Galerias de Brasaforja, Minas Afogadas, Poço do Atoleiro, Toca das Ratazanas Rubras.
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'fairy') — precisa de modelo de arte

### Zumbi da Catedral (`zombie`)
- **Nível 10** · vida 988 · golpe base 16 · **tamanho ×1**
- **Quem é:** Morto da Catedral, lento e teimoso; vomita bile.
- **Onde vive:** Territórios: Terra Maldita; Biomas: Terras Malditas; Masmorras: Catacumbas de Askavik, Cripta de Hemara, Cripta do Conde, Mausoléu Maldito de Vindholt, Túmulo dos Draugr.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Arqueiro Esquelético (`skel_arch`)
- **Nível 12** · vida 572 · golpe base 14 · **tamanho ×0.95**
- **Quem é:** Arqueiro morto. Fica longe, recua quando você chega e solta rajadas de flechas.
- **Traços:** Atira de longe
- **Magias (cada uma pede efeito e animação):** Rajada de Flechas
- **Onde vive:** Dono de: Cemitério Esquecido; Territórios: Bosques de Lundr, Colinas do Sul, Passo de Midvangr, Terra Maldita; Masmorras: Túneis de Orrukh.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; magia: Rajada de Flechas
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Esqueleto do Campo Santo (`skeleton`)
- **Nível 12** · vida 780 · golpe base 18 · **tamanho ×0.95**
- **Quem é:** Esqueleto do Campo Santo, de espada e escudo.
- **Onde vive:** Territórios: Minas de Cinzalto, Terra Maldita; Biomas: Terras Malditas, Vulcão; Masmorras: A Escada Sem Fim, Catacumbas de Askavik, Caverna da Garganta, Cripta de Hemara, Galerias Proibidas, Gruta do Fiorde, Mausoléu dos Esquecidos, Minas Afogadas, Túmulo dos Draugr, Túneis de Orrukh.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Carniçal (`ghoul`)
- **Nível 14** · vida 1352 · golpe base 22 · **tamanho ×0.9**
- **Quem é:** Carniçal: rápido, faminto, come os mortos.
- **Onde vive:** Biomas: Terras Malditas, Vulcão; Masmorras: A Escada Sem Fim, Arquivo dos Mapas, Catacumbas de Askavik, Cripta do Conde, Galerias Proibidas, Mausoléu Maldito de Vindholt, Minas Afogadas, Poço do Atoleiro, Túneis de Orrukh.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Caveira Flamejante (`skull_fire`)
- **Nível 14** · vida 364 · golpe base 16 · **tamanho ×1.25**
- **Quem é:** Crânio em chamas que voa, cospe brasa de longe e estoura ao morrer: saia de perto quando ele cai.
- **Traços:** Atira de longe, Explode: Estouro de Brasas, Voa
- **Onde vive:** Territórios: Coração da Montanha Negra, Minas de Cinzalto, Terra Maldita; Masmorras: Túneis de Orrukh.
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; explosão ao morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Zumbi do Lodo (`mudzombie`)
- **Nível 16** · vida 1092 · golpe base 18 · **tamanho ×1.05**
- **Quem é:** Zumbi do lodo dos charcos: lento, mas joga lama nos olhos.
- **Onde vive:** Territórios: Charcos do Oeste, Terra Maldita; Masmorras: Poço dos Afogados.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Necromante do Campo Santo (`necro`)
- **Nível 18** · vida 1248 · golpe base 20 · **tamanho ×1.05** · **ELITE / CHEFE**
- **Quem é:** Semichefe do Campo Santo: levanta esqueletos, rouba vida e some pela cova. Mate-o primeiro.
- **Traços:** Elite, Atira de longe
- **Magias (cada uma pede efeito e animação):** Levanta-te, Colheita de Vida, Passo de Cova
- **Onde vive:** Dono de: Cemitério Esquecido (à noite); Masmorras: Túneis de Orrukh.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; entrada / rugido de chefe; magia: Levanta-te; magia: Colheita de Vida; magia: Passo de Cova
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Espírito Maligno (`spirit`)
- **Nível 22** · vida 832 · golpe base 22 · **tamanho ×1**
- **Quem é:** Espírito maligno flutuante, arroxeado e translúcido, de mãos compridas.
- **Traços:** Voa
- **Magias (cada uma pede efeito e animação):** Lamento
- **Onde vive:** Lugares de morte, à noite
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Lamento
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Cavaleiro Sem Cabeça (`headless`)
- **Nível 24** · vida 2184 · golpe base 32 · **tamanho ×1** · **ELITE / CHEFE**
- **Quem é:** Cavalo negro de crina em brasa e um cavaleiro sem cabeça. Só nas noites da Terra Maldita. A carga dele corta a estrada inteira.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Carga da Meia-Noite, O Riso Sem Boca
- **Onde vive:** Dono de: Catedral Abandonada (à noite).
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Carga da Meia-Noite; magia: O Riso Sem Boca
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Caveira Gélida (`skull_frost`)
- **Nível 26** · vida 572 · golpe base 20 · **tamanho ×1.25**
- **Quem é:** A irmã gélida: cospe gelo, deixa você lento e estilhaça ao morrer.
- **Traços:** Atira de longe, Explode: Estilhaço de Gelo, Voa
- **Magias (cada uma pede efeito e animação):** Sopro Gélido
- **Onde vive:** Territórios: Colina Vampírica, Cordilheira do Norte, Montanha Viking.
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; explosão ao morrer; magia: Sopro Gélido
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Lich dos Esquecidos (`lich`)
- **Nível 30** · vida 4680 · golpe base 34 · **tamanho ×1.2** · **ELITE / CHEFE**
- **Quem é:** O guardião dos Túneis de Orrukh: chuva de almas, caveiras de gelo e o filactério que bebe a sua vida.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Chuva de Almas, Os Esquecidos, Correntes da Cripta, Filactério
- **Onde vive:** Masmorras: Túneis de Orrukh.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Chuva de Almas; magia: Os Esquecidos; magia: Correntes da Cripta; magia: Filactério
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Senhor dos Lamentos (`spirit_lord`)
- **Nível 30** · vida 4160 · golpe base 34 · **tamanho ×1.4** · **ELITE / CHEFE**
- **Quem é:** O Senhor dos Lamentos: um espírito enorme, de manto rasgado e rosto que é só um grito.
- **Traços:** Elite, Voa
- **Magias (cada uma pede efeito e animação):** Lamento, Chamado dos Mortos
- **Onde vive:** Lugares de morte, à noite
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Lamento; magia: Chamado dos Mortos
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Draugr Arqueiro (`draugr_arch`)
- **Nível 32** · vida 1352 · golpe base 24 · **tamanho ×1.05**
- **Quem é:** Morto do Fiorde com arco de osso; flechas geladas de longe.
- **Traços:** Atira de longe
- **Magias (cada uma pede efeito e animação):** Flechas do Fiorde
- **Onde vive:** Territórios: Montanha Viking; Masmorras: Salão de Hrímnir.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; magia: Flechas do Fiorde
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Draugr Berserker (`draugr_bers`)
- **Nível 34** · vida 2184 · golpe base 34 · **tamanho ×1.15**
- **Quem é:** Morto do Fiorde em fúria: corre em arrancos e salta.
- **Magias (cada uma pede efeito e animação):** Fúria do Fiorde
- **Onde vive:** Territórios: Montanha Viking; Masmorras: Salão de Hrímnir.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Fúria do Fiorde
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

## Demônios

### Puglin (`puglin`)
- **Nível 1** · vida 218 · golpe base 7 · **tamanho ×1.3**
- **Quem é:** Diabinho de cara amassada que anda em bando e rouba o que brilha.
- **Onde vive:** Territórios: Sopé de Brasaforja, Vale de Karmika; Biomas: Campos, Costa, Florestas, Pântanos, Ruínas.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** modelo de arte (Puglin)

### Diabrete (`imp`)
- **Nível 4** · vida 546 · golpe base 14 · **tamanho ×1**
- **Quem é:** Diabrete das fendas: cospe bola de fogo e foge rindo.
- **Onde vive:** Territórios: Charcos do Oeste, Coração da Montanha Negra, Minas de Cinzalto, Sopé de Brasaforja, Terra Maldita; Biomas: Neve, Pedregais, Pântanos, Ruínas, Terras Malditas, Vulcão; Masmorras: A Escada Sem Fim, Coração da Montanha, Galerias de Brasaforja.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** modelo de arte (Imp)

### Torturador de Bestas (`tormentor`)
- **Nível 7** · vida 3536 · golpe base 24 · **tamanho ×1.15** · **ELITE / CHEFE**
- **Quem é:** Demônio que tortura bichos na Clareira dos Gritos. Grilhões de sangue.
- **Traços:** Elite
- **Onde vive:** Masmorras: Catacumbas de Askavik, Caverna da Garganta, Mausoléu dos Esquecidos, Minas Afogadas.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe
- **Hoje no jogo:** corpo procedural (esqueleto 'prince') — precisa de modelo de arte

### Príncipe das Cinzas (`prince`)
- **Nível 8** · vida 2704 · golpe base 30 · **tamanho ×1** · **ELITE / CHEFE**
- **Quem é:** O Príncipe das Cinzas guarda a nave da Catedral pelo norte.
- **Traços:** Elite
- **Onde vive:** Masmorras: A Escada Sem Fim, Coração da Montanha, Cripta de Hemara, Cripta do Conde, Gruta do Fiorde, Mausoléu Maldito de Vindholt, Túmulo dos Draugr.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe
- **Hoje no jogo:** corpo procedural (esqueleto 'prince') — precisa de modelo de arte

### Diabrete Bombardeiro (`imp_bomb`)
- **Nível 16** · vida 416 · golpe base 16 · **tamanho ×0.9**
- **Quem é:** Voa alto demais para a espada e larga carvão aceso. Arco e magia resolvem.
- **Traços:** Atira de longe, Voa
- **Onde vive:** Territórios: Coração da Montanha Negra, Vale da Desgraça; Masmorras: Despensa da Fome Sem Fim.
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe
- **Hoje no jogo:** modelo de arte (Imp)

### Cão Infernal (`hellhound`)
- **Nível 20** · vida 780 · golpe base 20 · **tamanho ×1.5**
- **Quem é:** Cão do inferno que corre em matilha e deixa rastro de fogo na investida.
- **Magias (cada uma pede efeito e animação):** Rastro de Fogo
- **Onde vive:** Territórios: Colinas do Sul, Coração da Montanha Negra, Terra Maldita, Vale da Desgraça; Masmorras: Despensa da Fome Sem Fim.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Rastro de Fogo
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Bispo Caído (`bishop`)
- **Nível 28** · vida 13520 · golpe base 44 · **tamanho ×1.55**
- **Quem é:** O Bispo Caído, chefe final da Catedral. O juízo dele é roxo e profano.
- **Onde vive:** Masmorras: Galerias Proibidas.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'bishop') — precisa de modelo de arte

### Sheitã, o Gênio da Ilusão (`djinn`)
- **Nível 28** · vida 6240 · golpe base 40 · **tamanho ×1.7** · **ELITE / CHEFE**
- **Quem é:** Sheitã, o Gênio da Ilusão: sai da água do oásis, metade fumaça azul, cria cópias de si mesmo.
- **Traços:** Elite, Voa, Emboscada na água
- **Magias (cada uma pede efeito e animação):** Ilusões, Miragem
- **Onde vive:** O Oásis
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; sair da água (emboscada) e voltar; entrada / rugido de chefe; magia: Ilusões; magia: Miragem
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Súcubo das Cinzas (`succubus`)
- **Nível 30** · vida 1560 · golpe base 26 · **tamanho ×1**
- **Quem é:** Encanta: dentro do círculo dela, seus passos saem trocados por 3 segundos.
- **Magias (cada uma pede efeito e animação):** Beijo das Cinzas, Passo de Seda, Fome Doce
- **Onde vive:** Territórios: Colina Vampírica, Vale da Desgraça; Masmorras: Despensa da Fome Sem Fim.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Beijo das Cinzas; magia: Passo de Seda; magia: Fome Doce
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Demônio da Gula (`glutton`)
- **Nível 34** · vida 4680 · golpe base 40 · **tamanho ×1.3** · **ELITE / CHEFE**
- **Quem é:** Gordo, enorme, puxa você para a bocarra e arrota peste. Banqueteia-se com a sua vida.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Bocarra, Arroto Pestilento, Banquete
- **Onde vive:** Dono de: Castelo da Colina Vampírica; Masmorras: Despensa da Fome Sem Fim.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Bocarra; magia: Arroto Pestilento; magia: Banquete
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Pactário Quebrado (`pactbroken`)
- **Nível 38** · vida 1976 · golpe base 30 · **tamanho ×1.05**
- **Quem é:** O bruxo que falhou no pacto: metade gente, metade sombra. Cobra a dívida em vida.
- **Traços:** Atira de longe
- **Magias (cada uma pede efeito e animação):** A Dívida, Cláusulas
- **Onde vive:** Territórios: Coração da Montanha Negra, Vale da Desgraça.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; magia: A Dívida; magia: Cláusulas
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Senhor do Suplício (`suplicio`)
- **Nível 44** · vida 8320 · golpe base 48 · **tamanho ×1.4** · **ELITE / CHEFE**
- **Quem é:** Irmão maior do Torturador. Correntes que prendem no lugar, ganchos e o peso da culpa.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Correntes do Suplício, Ganchos, O Peso da Culpa, Vem Pagar
- **Onde vive:** Dono de: Vale da Desgraça.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Correntes do Suplício; magia: Ganchos; magia: O Peso da Culpa; magia: Vem Pagar
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

## Mata, Fadas e Ninhos

### Fada Maliciosa (`fairy`)
- **Nível 2** · vida 104 · golpe base 5 · **tamanho ×1.15**
- **Quem é:** Pequena, brilhante e maldosa: joga pó maldito e some.
- **Traços:** Voa
- **Onde vive:** Territórios: Bosque de Lithendel, Floresta Encantada, Florestas Élficas, Vale de Karmika; Biomas: Campos, Florestas, Mata Encantada, Pântanos; Masmorras: Raízes de Lithendel.
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'fairy') — precisa de modelo de arte

### Guardião da Mata (`treant`)
- **Nível 5** · vida 988 · golpe base 18 · **tamanho ×1** · **ELITE / CHEFE**
- **Quem é:** O Guardião da Mata. Raízes saem do chão onde ele aponta.
- **Traços:** Elite
- **Onde vive:** Territórios: Floresta Encantada, Florestas Élficas, Raízes Antigas; Biomas: Florestas, Mata Encantada; Masmorras: Raízes de Lithendel.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe
- **Hoje no jogo:** corpo procedural (esqueleto 'treant') — precisa de modelo de arte

### Aranha Filhote (`spiderling`)
- **Nível 6** · vida 94 · golpe base 5 · **tamanho ×0.5**
- **Quem é:** Filhote de aranha. Sozinho não é nada. A Mãe solta cem.
- **Onde vive:** Territórios: Bosque de Lithendel, Bosques de Lundr, Sopé de Brasaforja, Vale de Karmika; Masmorras: Ninho da Aracnídea-Mãe.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Aranha Tecelã (`spider`)
- **Nível 12** · vida 624 · golpe base 15 · **tamanho ×1.3**
- **Quem é:** Aranha Tecelã: anda em arrancos e prende você com teia.
- **Magias (cada uma pede efeito e animação):** Teia
- **Onde vive:** Territórios: Bosques de Lundr, Charcos do Oeste, Floresta Encantada, Florestas Élficas, Mata do Leste, Minas de Cinzalto, Passo de Midvangr, Planalto de Askavik, Raízes Antigas, Selva Licantropa; Masmorras: Ninho da Aracnídea-Mãe.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Teia
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Fungo Caminhante (`fungus`)
- **Nível 22** · vida 936 · golpe base 18 · **tamanho ×1.2**
- **Quem é:** Cogumelo que anda. Solta esporos e explode numa nuvem ao morrer.
- **Traços:** Explode: Nuvem de Esporos
- **Magias (cada uma pede efeito e animação):** Esporos
- **Onde vive:** Territórios: Floresta Encantada, Florestas Élficas, Mata do Leste, Raízes Antigas.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; explosão ao morrer; magia: Esporos
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Aracnídea-Mãe (`broodmother`)
- **Nível 28** · vida 12480 · golpe base 40 · **tamanho ×2** · **ELITE / CHEFE**
- **Quem é:** A Aracnídea-Mãe, de abdômen do tamanho de uma carroça: solta a ninhada sem fim, cospe ácido, teia que prende e cai sobre você.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** A Ninhada Sem Fim, Teia da Mãe, Cuspe Ácido, O Peso da Mãe
- **Onde vive:** Masmorras: Ninho da Aracnídea-Mãe.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: A Ninhada Sem Fim; magia: Teia da Mãe; magia: Cuspe Ácido; magia: O Peso da Mãe
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Fada Rainha (`fairyqueen`)
- **Nível 42** · vida 2704 · golpe base 30 · **tamanho ×2.6** · **ELITE / CHEFE**
- **Quem é:** A rainha das fadas: chama a corte, pó de estrelas, encanto que troca os passos e some num piscar.
- **Traços:** Elite, Voa
- **Magias (cada uma pede efeito e animação):** Corte das Fadas, Pó de Estrelas, Num Piscar, Encanto da Rainha
- **Onde vive:** Dono de: Lumenhal.
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Corte das Fadas; magia: Pó de Estrelas; magia: Num Piscar; magia: Encanto da Rainha
- **Hoje no jogo:** corpo procedural (esqueleto 'fairy') — precisa de modelo de arte

### Ent, Mestre da Mata (`ent`)
- **Nível 46** · vida 7280 · golpe base 50 · **tamanho ×3** · **ELITE / CHEFE**
- **Quem é:** O Mestre da Mata, alto e lânguido: raízes do mundo, o passo da floresta e árvores que acordam para lutar.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Raízes do Mundo, O Passo da Floresta, Abraço do Carvalho, A Mata Acorda
- **Onde vive:** Dono de: Pináculo de Marfim.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Raízes do Mundo; magia: O Passo da Floresta; magia: Abraço do Carvalho; magia: A Mata Acorda
- **Hoje no jogo:** corpo procedural (esqueleto 'treant') — precisa de modelo de arte

## Água e Areia

### Afogador (`drowner`)
- **Nível 10** · vida 780 · golpe base 15 · **tamanho ×1**
- **Quem é:** Espera submerso nas margens dos rios e sai da água quando você passa.
- **Traços:** Emboscada na água
- **Magias (cada uma pede efeito e animação):** Para o Fundo
- **Onde vive:** Territórios: Recifes da Graxa; Margens dos rios, em todo o mundo; Masmorras: Poço dos Afogados.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; sair da água (emboscada) e voltar; magia: Para o Fundo
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Serpente do Brejo (`swampsnake`)
- **Nível 14** · vida 676 · golpe base 16 · **tamanho ×1.4**
- **Quem é:** Espera submersa na margem. Sai da água e cospe peçonha.
- **Traços:** Emboscada na água
- **Magias (cada uma pede efeito e animação):** Cuspe de Peçonha
- **Onde vive:** Territórios: Charcos do Oeste, Mata do Leste, Raízes Antigas, Selva Licantropa; Masmorras: Poço dos Afogados.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; sair da água (emboscada) e voltar; magia: Cuspe de Peçonha
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Escorpião das Dunas (`scorpion`)
- **Nível 22** · vida 1144 · golpe base 22 · **tamanho ×1.5**
- **Quem é:** Enterrado na areia seca do sul até você pisar perto. Ferroada em cone.
- **Traços:** Enterrado na areia
- **Magias (cada uma pede efeito e animação):** Ferroada
- **Onde vive:** Territórios: Colinas do Sul, Costa do Vapor e da Graxa, Recifes da Graxa; Masmorras: Covil do Escorpião-Rei.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; sair da areia (emboscada); magia: Ferroada
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Sereia Canibal (`siren`)
- **Nível 24** · vida 1092 · golpe base 24 · **tamanho ×1.15**
- **Quem é:** Sereia canibal de pele esverdeada e cabelo de alga: espera na margem, canta e arrasta para a água.
- **Traços:** Emboscada na água
- **Magias (cada uma pede efeito e animação):** Canto
- **Onde vive:** Recifes, margens e o Oásis
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; sair da água (emboscada) e voltar; magia: Canto
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Afogador Antigo (`drowner_old`)
- **Nível 30** · vida 3120 · golpe base 36 · **tamanho ×1.35** · **ELITE / CHEFE**
- **Quem é:** O Afogador Antigo: puxa para o fundo, levanta onda e chama os afogados.
- **Traços:** Elite, Emboscada na água
- **Magias (cada uma pede efeito e animação):** O Rio Puxa, Onda, Os Afogados
- **Onde vive:** Dono de: Vatnaholt; Masmorras: Poço dos Afogados.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; sair da água (emboscada) e voltar; entrada / rugido de chefe; magia: O Rio Puxa; magia: Onda; magia: Os Afogados
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Rainha das Sereias (`siren_queen`)
- **Nível 32** · vida 4680 · golpe base 38 · **tamanho ×1.6** · **ELITE / CHEFE**
- **Quem é:** A Rainha das Sereias, maior, de coroa de conchas e escamas azul-escuras.
- **Traços:** Elite, Emboscada na água
- **Magias (cada uma pede efeito e animação):** Canto da Rainha, Maré
- **Onde vive:** Recifes e o Oásis
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; sair da água (emboscada) e voltar; entrada / rugido de chefe; magia: Canto da Rainha; magia: Maré
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Cobra Gigante (`giantsnake`)
- **Nível 36** · vida 4680 · golpe base 42 · **tamanho ×1.6** · **ELITE / CHEFE**
- **Quem é:** Cobra gigante de capelo da Selva Licantropa: bote de 11 metros e cone de peçonha.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Bote da Gigante, Peçonha
- **Onde vive:** Dono de: Árvore-Mãe do Uivo.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Bote da Gigante; magia: Peçonha
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Escorpião-Rei (`scorpion_king`)
- **Nível 36** · vida 5720 · golpe base 46 · **tamanho ×2.6** · **ELITE / CHEFE**
- **Quem é:** O Escorpião-Rei das dunas: investida, ferrões da areia, tempestade e a prole.
- **Traços:** Elite, Enterrado na areia
- **Magias (cada uma pede efeito e animação):** Investida das Dunas, Ferrões da Areia, Tempestade de Areia, A Prole
- **Onde vive:** Dono de: Ferrugem; Masmorras: Covil do Escorpião-Rei.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; sair da areia (emboscada); entrada / rugido de chefe; magia: Investida das Dunas; magia: Ferrões da Areia; magia: Tempestade de Areia; magia: A Prole
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

## Montanha e Gelo

### Harpia (`harpy`)
- **Nível 26** · vida 936 · golpe base 22 · **tamanho ×1.35**
- **Quem é:** Mulher-pássaro das escarpas: dá rasantes e corta com penas.
- **Traços:** Voa
- **Magias (cada uma pede efeito e animação):** Rasante
- **Onde vive:** Dono de: Hvítadalr; Territórios: Colinas do Sul, Cordilheira do Norte, Floresta Encantada, Montanha Viking.
- **Animações:** parado (respirando); voar parado; voo rápido; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Rasante
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Troll das Pedras (`troll`)
- **Nível 28** · vida 3640 · golpe base 38 · **tamanho ×1.35** · **ELITE / CHEFE**
- **Quem é:** Troll das pedras: regenera a vida sem parar — o fogo é o único jeito de fechar a ferida.
- **Traços:** Elite, Regenera (o fogo para)
- **Magias (cada uma pede efeito e animação):** Pedrada, Chuva de Pedras
- **Onde vive:** Dono de: Bjarnholt; Territórios: Cordilheira do Norte, Montanha Viking.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Pedrada; magia: Chuva de Pedras
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

### Jotun Menor (`jotun`)
- **Nível 40** · vida 9360 · golpe base 52 · **tamanho ×1.7** · **ELITE / CHEFE**
- **Quem é:** Jotun menor, gigante de gelo: pisada que derruba, sopro do inverno, nevasca.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Pisada do Gigante, Sopro do Inverno, Nevasca, Gelo que Racha
- **Onde vive:** Dono de: Fortaleza de Odin; Masmorras: Salão de Hrímnir.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Pisada do Gigante; magia: Sopro do Inverno; magia: Nevasca; magia: Gelo que Racha
- **Hoje no jogo:** corpo procedural (esqueleto 'zombie') — precisa de modelo de arte

## Máquinas

### Autômato de Latão (`automaton`)
- **Nível 24** · vida 1976 · golpe base 26 · **tamanho ×1.1**
- **Quem é:** Autômato de latão da Companhia que ficou sem dono. Descarga de vapor.
- **Magias (cada uma pede efeito e animação):** Descarga de Vapor
- **Onde vive:** Territórios: Costa do Vapor e da Graxa, Minas de Cinzalto, Recifes da Graxa; Masmorras: Fábrica Afogada de Ferrugem.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Descarga de Vapor
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Torreta a Vapor (`turret`)
- **Nível 26** · vida 1560 · golpe base 22 · **tamanho ×1.1**
- **Quem é:** Torreta fixa: metralha em leque. Abrigue-se ou chegue por trás.
- **Traços:** Atira de longe
- **Magias (cada uma pede efeito e animação):** Metralha
- **Onde vive:** Territórios: Costa do Vapor e da Graxa, Recifes da Graxa; Masmorras: Fábrica Afogada de Ferrugem.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; magia: Metralha
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Engenhoqueiro Enlouquecido (`tinker`)
- **Nível 28** · vida 1248 · golpe base 22 · **tamanho ×1**
- **Quem é:** Engenhoqueiro que perdeu o juízo. Joga bombas de relógio.
- **Traços:** Atira de longe
- **Magias (cada uma pede efeito e animação):** Bombas de Relógio
- **Onde vive:** Territórios: Costa do Vapor e da Graxa, Recifes da Graxa; Masmorras: Fábrica Afogada de Ferrugem.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; magia: Bombas de Relógio
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Colosso de Ferro (`colossus`)
- **Nível 38** · vida 10400 · golpe base 54 · **tamanho ×3** · **ELITE / CHEFE**
- **Quem é:** O Colosso de Ferro da fábrica afogada: martelo-pilão, linhas de vapor, rebites e linha de montagem.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Martelo-Pilão, Linhas de Vapor, Rebites, Linha de Montagem
- **Onde vive:** Dono de: Ferrugem; Masmorras: Fábrica Afogada de Ferrugem.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Martelo-Pilão; magia: Linhas de Vapor; magia: Rebites; magia: Linha de Montagem
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

## Gente

### Salteador (`bandit`)
- **Nível 8** · vida 572 · golpe base 12 · **tamanho ×1**
- **Quem é:** Salteador dos acampamentos à beira das estradas longas.
- **Onde vive:** Acampamentos de salteadores à beira das estradas longas.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Salteador Arqueiro (`bandit_arch`)
- **Nível 8** · vida 442 · golpe base 10 · **tamanho ×0.98**
- **Quem é:** O olheiro do bando, mais rápido que forte.
- **Onde vive:** Acampamentos de salteadores à beira das estradas longas.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Chefe dos Salteadores (`bandit_chief`)
- **Nível 10** · vida 2704 · golpe base 18 · **tamanho ×1.12** · **ELITE / CHEFE**
- **Quem é:** O Chefe dos Salteadores: maior, mais duro, chama a quadrilha e investe.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Investida do Chefe, Grito de Guerra, A Quadrilha
- **Onde vive:** Acampamentos de salteadores à beira das estradas longas.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Investida do Chefe; magia: Grito de Guerra; magia: A Quadrilha
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Caçador Maldito (`hunter`)
- **Nível 16** · vida 1196 · golpe base 20 · **tamanho ×1**
- **Quem é:** Caçador Maldito que perdeu a razão na mata.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Peregrina Élfica (`pilgrim`)
- **Nível 18** · vida 1144 · golpe base 18 · **tamanho ×0.98**
- **Quem é:** Peregrina élfica a caminho dos santuários.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Negociante de Gente (`slaver`)
- **Nível 18** · vida 1196 · golpe base 20 · **tamanho ×1.05**
- **Quem é:** Negociante de gente: laço que puxa e reféns amarrados atrás.
- **Magias (cada uma pede efeito e animação):** Laço
- **Onde vive:** Territórios: Colinas do Sul, Planalto de Askavik.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Laço
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Bruxo do Círculo (`cultist`)
- **Nível 20** · vida 1248 · golpe base 24 · **tamanho ×1**
- **Quem é:** Bruxo do Círculo, de cajado retorcido.
- **Onde vive:** Territórios: Vale da Desgraça.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Soldado da Patrulha (`soldier`)
- **Nível 20** · vida 1560 · golpe base 22 · **tamanho ×1**
- **Quem é:** Patrulha das cidades. Só briga com quem briga.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Batedor Élfico Corrompido (`elfscout`)
- **Nível 22** · vida 1040 · golpe base 22 · **tamanho ×0.98**
- **Quem é:** Batedor élfico corrompido: invisível de longe até atirar; flecha envenenada.
- **Traços:** Atira de longe, Invisível de longe
- **Magias (cada uma pede efeito e animação):** Chuva de Folhas, Some na Mata
- **Onde vive:** Territórios: Floresta Encantada, Florestas Élficas, Mata do Leste, Raízes Antigas.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; magia: Chuva de Folhas; magia: Some na Mata
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Templário de Auréon (`templar`)
- **Nível 22** · vida 1976 · golpe base 24 · **tamanho ×1.02**
- **Quem é:** Templário de Auréon, a lei da Igreja na estrada.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Cria do Conde (`vampire`)
- **Nível 22** · vida 1560 · golpe base 26 · **tamanho ×1**
- **Quem é:** Cria do Conde: rápida, de adaga.
- **Onde vive:** Territórios: Colina Vampírica.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Paladino Negro (`darkpal`)
- **Nível 24** · vida 2184 · golpe base 28 · **tamanho ×1.05**
- **Quem é:** Paladino que trocou a Luz pela força. Martelo e escudo negros.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Inquisidor Kármico (`inquisitor`)
- **Nível 30** · vida 2184 · golpe base 30 · **tamanho ×1.05**
- **Quem é:** A lei kármica das estradas: só caça quem tem karma muito baixo. Com você em paz, só vigia.
- **Traços:** Só caça karma baixo
- **Magias (cada uma pede efeito e animação):** Sentença, Fogo Kármico
- **Onde vive:** Dono de: Steinfoss, Grenivik.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Sentença; magia: Fogo Kármico
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

### Capanga do Conde (`thrall`)
- **Nível 48** · vida 2704 · golpe base 36 · **tamanho ×1.05**
- **Quem é:** Capanga humano que guarda o castelo do Conde de dia.
- **Magias (cada uma pede efeito e animação):** Arrancada
- **Onde vive:** Territórios: Colina Vampírica.
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; magia: Arrancada
- **Hoje no jogo:** corpo procedural (esqueleto 'human') — precisa de modelo de arte

## Goblins

### Goblin Saqueador (`goblin`)
- **Nível 6** · vida 364 · golpe base 10 · **tamanho ×0.9**
- **Quem é:** Goblin saqueador, baixinho e verde, de faca enferrujada. Anda em bando, rouba e foge quando o bando cai.
- **Onde vive:** Acampamentos goblins nas matas e ruínas
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Xamã Goblin (`goblin_shaman`)
- **Nível 9** · vida 416 · golpe base 14 · **tamanho ×0.95**
- **Quem é:** Xamã goblin de cajado com ossinhos e penas; fica atrás do bando e lança feitiços de longe.
- **Traços:** Atira de longe
- **Magias (cada uma pede efeito e animação):** Feitiço do Xamã
- **Onde vive:** Acampamentos goblins
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; disparo / arremesso de longe; magia: Feitiço do Xamã
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

### Chefe Goblin (`goblin_chief`)
- **Nível 12** · vida 2184 · golpe base 24 · **tamanho ×1.35** · **ELITE / CHEFE**
- **Quem é:** O chefe do bando: maior, de machado pesado e capa de pele roubada.
- **Traços:** Elite
- **Magias (cada uma pede efeito e animação):** Grito do Bando
- **Onde vive:** Acampamentos goblins
- **Animações:** parado (respirando); andar; correr; preparo do golpe (bem legível, é o aviso ao jogador); golpe; levar dano; morrer; entrada / rugido de chefe; magia: Grito do Bando
- **Hoje no jogo:** corpo procedural próprio — precisa de modelo de arte

## Masmorras, pets e montarias
As listas de masmorras (com elite e chefe), pets e montarias continuam como no bestiário de 26/10 (`bestiario-26-10.md`).