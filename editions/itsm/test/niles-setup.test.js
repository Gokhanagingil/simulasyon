import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const scenario = read('itsm-v1');
const setup = read('niles-itsm-setup');

test('Niles setup mirrors the canonical scenario services, CIs, SLAs and event routes', () => {
  assert.equal(setup.scenarioId, scenario.id);
  assert.equal(setup.scenarioVersion, scenario.version);
  for (const key of ['services', 'cis', 'slaPolicies']) assert.deepEqual(setup[key], scenario[key], key);
  const fields = ['id', 'recordType', 'serviceId', 'ciId', 'priority'];
  assert.deepEqual(setup.eventMapping, scenario.events.map(event => Object.fromEntries(fields.map(key => [key, event[key]]))));
  assert.deepEqual(setup.users.map(user => ({ id: user.roleId, name: user.role })), scenario.roles.map(role => ({ id: role.id, name: role.name })));
});

test('Niles baseline retains the intentional shared-power risk and animal identity chain', () => {
  assert.equal(setup.services.length, 5);
  assert.equal(setup.cis.length, 15);
  assert.equal(setup.services.reduce((n, service) => n + service.cis.length, 0), 17);
  assert.equal(setup.cis.filter(ci => ci.dependsOn).length, 13);
  assert.deepEqual(setup.services.flatMap(service => (service.requiresServices || []).map(dependency => [service.id, dependency])), [['SVC-OBS', 'SVC-WATER']]);
  const ci = id => setup.cis.find(item => item.id === id);
  assert.equal(ci('CI-P1').dependsOn, 'CI-B1');
  assert.equal(ci('CI-P2').dependsOn, 'CI-B1');
  for (const [from, to] of [['CI-HIPPO','CI-ELIF'], ['CI-ELIF','CI-HABITAT'], ['CI-HABITAT','CI-PA'], ['CI-PA','CI-NET']]) assert.equal(ci(from).dependsOn, to);
  assert.equal(ci('CI-HIPPO').identity, 'MV-A-001');
  assert.equal(new Set(setup.cis.filter(item => item.kind === 'animal').map(item => item.identity)).size, 3);
  for (const service of setup.services) for (const id of service.cis) assert.ok(ci(id));
  for (const item of setup.cis) if (item.dependsOn) assert.ok(ci(item.dependsOn));
});

test('catalog offerings remain explicitly proposed templates, not live or runtime records', () => {
  assert.equal(setup.status, 'source_template_only');
  assert.equal(setup.liveVerified, false);
  assert.equal(setup.proposedCatalogOfferings.length, 3);
  const services = new Set(setup.services.map(item => item.id));
  const cis = new Set(setup.cis.map(item => item.id));
  for (const offering of setup.proposedCatalogOfferings) {
    assert.equal(offering.status, 'proposed_template');
    assert.equal(offering.liveVerified, false);
    assert.ok(services.has(offering.serviceId));
    assert.ok(cis.has(offering.ciId));
    assert.ok(offering.completionEvidence.length > 0);
  }
  assert.equal(setup.proposedCatalogOfferings.find(item => item.code === 'MV-CAT-OBS').requestEventId, 'E02');
  assert.deepEqual(setup.proposedCatalogOfferings.find(item => item.code === 'MV-CAT-OBS').relatedEventIds, ['E09', 'E10']);
  assert.equal(setup.proposedCatalogOfferings.find(item => item.code === 'MV-CAT-KIT').optional, true);
  assert.equal(setup.eventMapping.find(item => item.id === 'E11').recordType, 'task');
});

test('live mapping limits never promote descriptive dependencies or catalog drafts to integrated PASS', () => {
  const limits = setup.platformMappingLimits;
  assert.equal(limits.integrationAcceptance, 'NOT_VERIFIED');
  assert.equal(limits.serviceDependencies.nilesRepresentation, 'description_only');
  assert.equal(limits.serviceDependencies.structuralEdgeSupported, false);
  assert.deepEqual(limits.serviceDependencies.desired, [{ from: 'SVC-OBS', to: 'SVC-WATER', type: 'depends_on' }]);
  assert.equal(limits.catalog.publicationStatus, 'pending');
  assert.equal(limits.catalog.draftCount, 2);
  assert.equal(limits.catalog.approvalUiStatus, 'not_available_in_inspected_live_version');
});
