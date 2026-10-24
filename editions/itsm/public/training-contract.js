import { trainingContractData } from './training-contract-data.js';

function freeze(value) {
 if(value&&typeof value==='object') {Object.values(value).forEach(freeze);Object.freeze(value);}
 return value;
}
export const trainingContract = freeze(trainingContractData);
function moduleFor(moduleId) {
 const trainingModule=Object.hasOwn(trainingContract.modules,moduleId)&&trainingContract.modules[moduleId];
 if(!trainingModule)throw new Error('Unknown training module: '+moduleId);
 return trainingModule;
}
// Explicit public allowlist: never accepts a session, event projection, envelope or private role facts.
export function getRoleBriefing(moduleId,roleId) {
 const trainingModule=moduleFor(moduleId),hat=Object.hasOwn(trainingModule.roleHats,roleId)&&trainingModule.roleHats[roleId];
 if(!hat)return null;
 const person=trainingContract.roles.find(role=>role.id===roleId);
 return {id:roleId,title:hat.title,personTitle:person?.title||'Eğitmen',ownedCiIds:[...(person?.ownedCiIds||[])],portfolioActive:trainingModule.portfolioActive,publicMission:hat.publicMission,firstAction:hat.firstAction,publicAuthorityBoundary:hat.publicAuthorityBoundary,can:hat.can,partner:hat.partner};
}
export function getPublicBriefing(moduleId) {
 const trainingModule=moduleFor(moduleId);
 return {contractId:trainingContract.id,version:trainingContract.version,moduleId,title:trainingModule.title,durationMinutes:trainingModule.durationMinutes,debriefMinutes:trainingModule.debriefMinutes,fiction:trainingModule.fiction,firstAction:trainingModule.firstAction,rules:[...trainingModule.rules],conditions:[...trainingModule.conditions],resources:{...trainingModule.resources},identity:{...trainingContract.identity},authority:structuredClone(trainingModule.authority),roles:Object.keys(trainingModule.roleHats).map(id=>getRoleBriefing(moduleId,id))};
}
export function changeAuthorityFor(moduleId,operation) {
 const authority=moduleFor(moduleId).authority.changeApproval;
 return Object.hasOwn(authority,operation)?authority[operation]:null;
}
// Public-only adapter for the audio/transcript facilitator. No actual learner facts or private evidence.
export function publicFacilitatorContract(moduleId) {
 const briefing=getPublicBriefing(moduleId);
 return {...briefing,mode:moduleId,roles:briefing.roles.map(role=>({id:role.id,title:role.title,publicMission:role.publicMission,publicAuthorityBoundary:role.publicAuthorityBoundary})),openingConditions:{durationMinutes:briefing.durationMinutes,normalBudget:briefing.resources.normalBudget,technicians:briefing.resources.technicians},audience:'shared_public'};
}
