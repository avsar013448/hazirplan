<script lang="ts">
  // Acil Kişiler editörü — kişiler + evrak/finans bölümü
  import { saveSheet } from '../../saveSheet';
  import type { AcilKisilerSheet } from '../../types';

  let { sheet }: { sheet: AcilKisilerSheet } = $props();
  let s = $state(sheet);
  let savedAt = $state(0);
  let docs = $state(s.documents ?? { kimlikler: false, sigorta: false, nakit: false, kopyaYeri: '' });

  async function persist() {
    s.documents = docs;
    await saveSheet(s);
    savedAt = Date.now();
  }

  function setContact(idx: number, key: 'name' | 'phone' | 'relation', e: Event) {
    s.contacts[idx][key] = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
  function addContact() {
    s.contacts = [...s.contacts, { name: '', phone: '', relation: '' }];
    persist();
  }
  function setDoc(key: 'kimlikler' | 'sigorta' | 'nakit', e: Event) {
    docs = { ...docs, [key]: (e.currentTarget as HTMLInputElement).checked };
    persist();
  }
</script>

<div class="kisiler">
  <h3>👤 {s.title}</h3>
  <ul>
    {#each s.contacts as c, i (i)}
      <li>
        <input type="text" value={c.name} placeholder="İsim" oninput={(e) => setContact(i, 'name', e)} onblur={persist} />
        <input type="tel" value={c.phone} placeholder="Telefon" oninput={(e) => setContact(i, 'phone', e)} onblur={persist} />
        <input type="text" value={c.relation} placeholder="Yakınlık (komşu, doktor…)" oninput={(e) => setContact(i, 'relation', e)} onblur={persist} />
        <button class="ghost" onclick={async () => { s.contacts = s.contacts.filter((_, j) => j !== i); await persist(); }}>Sil</button>
      </li>
    {/each}
  </ul>
  <button class="add" onclick={addContact}>+ Kişi ekle</button>

  <fieldset>
    <legend>Evrak & Finans</legend>
    <label class="checkline">
      <input type="checkbox" checked={docs.kimlikler} onchange={(e) => setDoc('kimlikler', e)} />
      Kimlik belgeleri listesi hazır (kimlik, tapu, diploma, sağlık belgeleri)
    </label>
    <label class="checkline">
      <input type="checkbox" checked={docs.sigorta} onchange={(e) => setDoc('sigorta', e)} />
      Sigorta bilgileri kayıtlı (DASK vb. poliçe no + telefon)
    </label>
    <label class="checkline">
      <input type="checkbox" checked={docs.nakit} onchange={(e) => setDoc('nakit', e)} />
      Nakit buffer (küçük banknotlar, çantada)
    </label>
    <label class="col">
      Belgelerin kopyası nerede?
      <input type="text" placeholder="ör: çantadaki USB, bulut, banka kasası" value={docs.kopyaYeri}
        oninput={(e) => { docs = { ...docs, kopyaYeri: (e.currentTarget as HTMLInputElement).value }; }}
        onblur={persist} />
    </label>
  </fieldset>
  {#if savedAt}<span class="saved">Saved</span>{/if}
</div>

<style>
  .kisiler { display: flex; flex-direction: column; gap: 10px; }
  h3 { margin: 0; font-size: 1rem; }
  ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  li { display: flex; gap: 6px; }
  li input { flex: 1; font: inherit; padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
  fieldset { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; }
  legend { font-size: .85rem; font-weight: 600; padding: 0 6px; }
  .checkline { display: flex; align-items: center; gap: 8px; font-size: .9rem; }
  .col { display: flex; flex-direction: column; gap: 4px; font-size: .9rem; }
  .col input { font: inherit; padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .add, .ghost { font: inherit; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
  .add { background: #f59e0b; border-color: #f59e0b; font-weight: 600; color: #111; width: fit-content; }
  .saved { color: #16a34a; font-size: .8rem; }
</style>
