/* OS DESPOJOS NO MUNDO (17/11): o monte que fica no chão onde a alma se soltou do corpo. Regras e dados em morte/despojos.ts.
   Chegar perto do próprio monte recolhe tudo. O monte fica guardado entre sessões até ser recolhido. */
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { heightAt } from '../world';
import { fine } from '../dual3d';
import { carrega, guarda, juiz, quantos, vazio, CHANCE_PVP, type Despojo, type Pacote } from '../morte';

export interface DespojosCtx { scene: THREE.Scene; despoja(cai: (nome: string) => boolean): Pacote; devolve(p: Pacote): void; log(t: string, cor?: string): void; heroi(): { x: number; z: number }; morto(): boolean; dentro(): boolean; nome(): string }
export function createDespojosMundo(K: DespojosCtx) {
  const L: Despojo[] = carrega(), M = new Map<Despojo, THREE.Group>();
  const ouro = new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), pano = new THREE.MeshLambertMaterial({ color: 0x6a4a2e }), corda = new THREE.MeshLambertMaterial({ color: 0xc9b07a });
  function monta(q: Despojo) { const G = new THREE.Group(), x = q.x * T, z = q.y * T; G.position.set(x, heightAt(x, z), z);
    const saco = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), pano); saco.scale.set(1, 0.8, 1); saco.position.y = 0.3; saco.castShadow = true; G.add(saco);
    const boca = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 5, 10), corda); boca.rotation.x = Math.PI / 2; boca.position.y = 0.62; G.add(boca);
    const sh = new THREE.Shape(); sh.moveTo(0, 0.34); sh.lineTo(0.2, 0); sh.lineTo(0, -0.34); sh.lineTo(-0.2, 0); sh.closePath(); const loz = new THREE.Mesh(new THREE.ShapeGeometry(sh), ouro); loz.position.y = 1.5; loz.name = 'loz'; G.add(loz);
    const facho = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, 6, 8, 1, true), ouro.clone()); (facho.material as THREE.MeshBasicMaterial).opacity = 0.28; facho.position.y = 3.2; G.add(facho);
    K.scene.add(fine(G)); M.set(q, G); }
  for (const q of L) monta(q);
  let t = 0, aviso = 0;
  return {
    /** a alma se soltou: o que cai fica num monte em (x, y), em casas do mapa. Devolve quantos itens caíram e o que os dados disseram. */
    deixa(x: number, y: number, pvp: boolean) { const j = juiz(pvp), pacote = K.despoja(j.cai); if (vazio(pacote)) return { n: 0, rolagens: j.rolagens };
      const q: Despojo = { x, y, nome: K.nome(), em: Date.now(), pvp, pacote }; L.push(q); guarda(L); monta(q);
      const n = quantos(pacote);
      if (pvp) { const caiu = j.rolagens.filter((r) => r.cai); K.log(`🎲 Morte por outro jogador: um d100 para cada item, cai com ${CHANCE_PVP} ou menos. ${caiu.length} de ${j.rolagens.length} caíram.`, '#ff9a8a'); for (const r of caiu.slice(0, 10)) K.log(`🎲 ${r.dado}: ${r.nome} caiu.`, '#ffb89a'); if (caiu.length > 10) K.log(`… e mais ${caiu.length - 10}.`, '#ffb89a'); }
      else K.log(`☠ Tudo o que você carregava ficou onde o corpo caiu (${n} ${n === 1 ? 'item' : 'itens'}). O que está no baú está a salvo.`, '#ff9a8a');
      return { n, rolagens: j.rolagens }; },
    /** a Lágrima paga a volta: o último monte volta inteiro para o personagem */
    lagrima() { const q = L.pop(); if (!q) return 0; K.devolve(q.pacote); const G = M.get(q); if (G) { K.scene.remove(G); M.delete(q); } guarda(L); return quantos(q.pacote); },
    /** todo quadro: os montes giram e brilham; chegar perto recolhe */
    tick(dt: number) { if (!L.length) return; t += dt; const h = K.heroi();
      for (let i = L.length - 1; i >= 0; i--) { const q = L[i], G = M.get(q); if (!G) continue; const loz = G.getObjectByName('loz'); if (loz) { loz.rotation.y = t * 1.6; loz.position.y = 1.5 + Math.sin(t * 2) * 0.12; }
        if (K.morto() || K.dentro()) continue; const dd = Math.hypot(G.position.x - h.x, G.position.z - h.z);
        if (dd < 1.8) { K.devolve(q.pacote); const n = quantos(q.pacote); K.scene.remove(G); M.delete(q); L.splice(i, 1); guarda(L); K.log(`✦ Você recolhe os seus despojos: ${n} ${n === 1 ? 'item volta' : 'itens voltam'} para você.`, '#ffe08a'); }
        else if (dd < 40 && t > aviso) { aviso = t + 60; K.log('✦ Os seus despojos estão por perto: siga o facho dourado.', '#ffe08a'); } } },
    get montes() { return L; },
  };
}
