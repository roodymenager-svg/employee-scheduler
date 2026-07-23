window.emailFor = function(daysToSend){const entries=daysToSend.flatMap(d=>visiblePeople(d).map(x=>({...x,day:d.day}))),recipients=[...new Set(entries.map(x=>contacts[x.person]).filter(Boolean))];if(!recipients.length)return show('No scheduled employees have an email address. Add contact details before preparing an email.',true);const byPerson={};entries.forEach(e=>{if(contacts[e.person]){const details=[e.team,e.site&&`Site: ${e.site}`,e.chauffeur&&`Chauffeur: ${e.chauffeur}`].filter(Boolean).join(' | ');(byPerson[e.person]??=[]).push(`${e.day} - ${details}`)}});const body=['Hello,','', 'Here is your JCL work schedule:','',...Object.entries(byPerson).flatMap(([name,items])=>[`${name}:`,...items.map(x=>'- '+x),'']),'Please contact your supervisor if you have any question.','', 'JCL Multiservices'].join('\n');window.location.href=`mailto:${encodeURIComponent(recipients.join(','))}?subject=${encodeURIComponent('JCL work schedule')}&body=${encodeURIComponent(body)}`;const missing=[...new Set(entries.map(e=>e.person).filter(p=>!contacts[p]))];show(`Email draft prepared for ${recipients.length} employee(s).${missing.length?' Missing email: '+missing.join(', ')+'.':''}`)}
window.prepareDay = function(i){emailFor([schedule[i]])}; if ($('sendAll')) {
    $('sendAll').onclick = () => emailFor(schedule);
    $('importFile').onchange = e => {
        if (e.target.files[0]) importWorkbook(e.target.files[0]);
        e.target.value = '';
    };
    $('addEmployee').onclick = addEmployee;
    $('updatePeriod').onclick = updateCalendarPeriod;
    $('previousPeriod').onclick = () => shiftCalendarPeriod(-7);
    $('nextPeriod').onclick = () => shiftCalendarPeriod(7);

    setCalendarPeriod(
        parseCalendarDate($('periodStart').value),
        parseCalendarDate($('periodEnd').value)
    );
}
setCalendarPeriod(parseCalendarDate($('periodStart').value),parseCalendarDate($('periodEnd').value));
window.appState = function(){return {contacts,sites,schedule,periodStart:$('periodStart').value,periodEnd:$('periodEnd').value};}
window.appState=appState;
