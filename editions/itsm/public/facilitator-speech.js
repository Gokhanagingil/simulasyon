// Optional deterministic device narration. No microphone and no provider API.
// Only a browser-reported LOCAL Turkish voice may be selected. Browser/OS
// behavior and naturalness still require device verification before classroom use.
export function localTurkishVoices(synth=globalThis.speechSynthesis){return synth?.getVoices?.().filter(v=>v.localService===true&&/^tr(?:-|_)/i.test(v.lang))||[];}
export function createLocalSpeech({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,onText=()=>{},onUnavailable=()=>{}}={}){
 let enabled=false,voice=null,sequence=0,activeUtterance=null;
 return {
  enable(selected){if(!synth||!Utterance)throw new Error('TEXT_ONLY_NO_SPEECH_SUPPORT');if(!localTurkishVoices(synth).includes(selected))throw new Error('LOCAL_TURKISH_VOICE_REQUIRED');sequence++;activeUtterance=null;voice=selected;enabled=true;synth.cancel();},
  disable(){sequence++;activeUtterance=null;enabled=false;voice=null;synth?.cancel();},
  cancel(){sequence++;activeUtterance=null;synth?.cancel();},
  publish(message){
   const current=++sequence;onText(message);if(!enabled||sequence!==current)return;
   if(!localTurkishVoices(synth).includes(voice)){enabled=false;activeUtterance=null;synth?.cancel();return;}
   const u=new Utterance(message.text);u.voice=voice;u.lang=voice.lang;u.rate=1;
   const unavailable=event=>{
    // Cancellation and newer speech/voice choices supersede old callbacks.
    // Only a still-current failed utterance can turn this output off.
    if(!enabled||sequence!==current||activeUtterance!==u)return;
    sequence++;activeUtterance=null;enabled=false;voice=null;synth.cancel();
    onUnavailable({reason:'speech_error',error:typeof event?.error==='string'?event.error:'unknown'});
   };
   u.onerror=unavailable;
   u.onend=()=>{if(sequence===current&&activeUtterance===u)activeUtterance=null;};
   synth.cancel();
   if(enabled&&sequence===current){activeUtterance=u;try{synth.speak(u);}catch{unavailable({error:'synthesis-failed'});}}
  }
 };
}
