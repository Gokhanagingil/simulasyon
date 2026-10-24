// Simulation permissions are derived from authenticated workshop membership only.
// They grant no privileges in Niles or any external system.
export const typeOwners={incident:['R2','R3','R4'],request:['R1','R2'],problem:['R4','R5'],change:['R4','R6'],knowledge:['R2','R5'],task:['R1','R4','R5','R7','R8']};
export const eventOwners={E06:['R4','R5'],E11:['R4','R7'],E12:['R1','R2','R8']};
export const roleActions={R1:['fund'],R2:['share'],R3:['share','validate'],R4:['share','inspect','plan','execute'],R5:['share','inspect'],R6:['approve'],R7:['share','support'],R8:['share']};
export function recordPermissions(role,trainer,record){const owns=!!trainer||(eventOwners[record.event_id]||typeOwners[record.type]||[]).includes(role);return {ack:owns,note:!!trainer||!!role,propose:owns,niles:!!trainer||role==='R2',evaluate:!!trainer,release:!!trainer};}
export const actionLabels={share:'Rol kanıtını ekiple paylaş',inspect:'CMDB bağımlılığını incele',plan:'Teknik değişiklik planla',fund:'Oyun bütçesini ayır',approve:'Riski değerlendir ve onayla',execute:'Onaylı planı uygula',validate:'Sahada hizmeti doğrula',support:'Tedarik desteğine teknisyen ayır',pace:'Baskı saatini yönet'};
export function encounterPermissions(role,trainer){return Object.keys(actionLabels).filter(a=>trainer||(roleActions[role]||[]).includes(a));}
