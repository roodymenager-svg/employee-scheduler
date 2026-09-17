export const isoLocal=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const parseLocal=value=>{const [y,m,d]=String(value).split('-').map(Number);return new Date(y,m-1,d,12)};
export function weekStart(date){const value=new Date(date);value.setHours(12,0,0,0);value.setDate(value.getDate()-value.getDay());return value}
export function lastCompletedWeek(today=new Date()){const start=weekStart(today);start.setDate(start.getDate()-7);return start}
export function weekDates(start){return Array.from({length:7},(_,index)=>{const date=new Date(start);date.setDate(start.getDate()+index);return isoLocal(date)})}
export function minutesWorked(employee){
  if(!/^\d{2}:\d{2}$/.test(employee?.start||'')||!/^\d{2}:\d{2}$/.test(employee?.end||''))return null;
  const [sh,sm]=employee.start.split(':').map(Number),[eh,em]=employee.end.split(':').map(Number),pause=Number(employee.pause??0);
  if(sh>23||eh>23||sm>59||em>59||!Number.isFinite(pause)||pause<0)return null;
  let minutes=(eh*60+em)-(sh*60+sm);if(minutes<0)minutes+=1440;minutes-=pause;
  return minutes>=0&&minutes<=1440?minutes:null;
}
export function groupFor(team){return /COMPTEC/i.test(String(team?.assignmentType||team?.task||''))?'comptec':'jcl'}
const dayFor=(state,date)=>state?.archive?.[date]||state?.schedule?.find(day=>day.date===date)||{date,teams:[]};
export function weekMetrics(state,reports,start){
  const result={jcl:{minutes:0,km:0,teams:0,incomplete:0,missingHours:0,missingKm:0,daily:Array(7).fill(0)},comptec:{minutes:0,km:0,teams:0,incomplete:0,missingHours:0,missingKm:0,daily:Array(7).fill(0)}};
  weekDates(start).forEach((date,dayIndex)=>{
    const scheduled=dayFor(state,date).teams||[],saved=reports?.[date]?.teams||[];
    const source=scheduled.length?scheduled:saved;
    source.forEach((team,index)=>{
      const people=scheduled.length?(team.members||[]):(team.employees||[]).map(person=>person.name);
      if(!people.length)return;
      const metric=result[groupFor(team)];metric.teams++;
      const key=`${index}-${team.name||'Équipe'}`;
      const reportTeam=saved.find(item=>item.key===key)||saved.find(item=>item.name===team.name);
      let missing=false;
      people.forEach(name=>{
        const entry=reportTeam?.employees?.find(person=>person.name===name),minutes=minutesWorked(entry);
        if(minutes===null){metric.missingHours++;missing=true;return}
        metric.minutes+=minutes;metric.daily[dayIndex]+=minutes;
      });
      const raw=reportTeam?.distance;
      if(raw===''||raw===undefined||raw===null||!Number.isFinite(Number(raw))||Number(raw)<0){metric.missingKm++;missing=true}
      else metric.km+=Number(raw);
      if(missing)metric.incomplete++;
    });
  });
  return result;
}
export function workforceMetrics(state,start){
  const dates=weekDates(start),scheduled=new Map();
  dates.forEach(date=>{
    (dayFor(state,date).teams||[]).forEach(team=>(team.members||[]).forEach(name=>{
      const clean=String(name||'').trim().replace(/\s+/g,' ');
      if(clean)scheduled.set(clean.toLocaleLowerCase('fr-CA'),clean);
    }));
  });
  const from=parseLocal(dates[0]).getTime(),until=parseLocal(dates[6]).getTime()+24*60*60*1000;
  const newEmployees=(state?.employees||[]).filter(employee=>{
    const createdAt=typeof employee?.createdAt==='number'?employee.createdAt:Date.parse(employee?.createdAt||'');
    return Number.isFinite(createdAt)&&createdAt>=from&&createdAt<until;
  }).length;
  return {newEmployees,scheduledEmployees:scheduled.size};
}
export function topDriversForWeek(state,reports,start){
  const totals=new Map();
  let missing=0;
  weekDates(start).forEach(date=>{
    const scheduled=dayFor(state,date).teams||[],saved=reports?.[date]?.teams||[];
    const matched=new Set();
    const candidates=scheduled.map((team,index)=>{
      const key=`${index}-${team.name||'Équipe'}`;
      const reportIndex=saved.findIndex(item=>item.key===key||item.name===team.name);
      if(reportIndex>=0)matched.add(reportIndex);
      return {team,reportTeam:reportIndex>=0?saved[reportIndex]:null};
    });
    saved.forEach((reportTeam,index)=>{if(!matched.has(index))candidates.push({team:null,reportTeam})});
    candidates.forEach(({team,reportTeam})=>{
      const people=team?.members||reportTeam?.employees||[];
      if(!people.length&&!reportTeam?.distance)return;
      const name=String(reportTeam?.chauffeur||reportTeam?.driverName||reportTeam?.driver||team?.driver||'').trim().replace(/\s+/g,' ');
      const raw=reportTeam?.distance;
      if(!name||raw===''||raw===undefined||raw===null||!Number.isFinite(Number(raw))||Number(raw)<0){missing++;return}
      const normalized=name.toLocaleLowerCase('fr-CA');
      const previous=totals.get(normalized)||{name,km:0};
      previous.km+=Number(raw);
      totals.set(normalized,previous);
    });
  });
  const ranked=[...totals.values()].sort((a,b)=>b.km-a.km||a.name.localeCompare(b.name,'fr-CA'));
  const best=ranked[0]?.km;
  return {leaders:ranked.filter(item=>item.km===best),missing};
}
export function topEmployeesByHoursForWeek(reports,start){
  const totals=new Map();
  let missing=0;
  weekDates(start).forEach(date=>{
    (reports?.[date]?.teams||[]).forEach(team=>{
      (team?.employees||[]).forEach(employee=>{
        const name=String(employee?.name||'').trim().replace(/\s+/g,' ');
        if(!name)return;
        const minutes=minutesWorked(employee);
        if(minutes===null){missing++;return}
        const normalized=name.toLocaleLowerCase('fr-CA');
        const previous=totals.get(normalized)||{name,minutes:0};
        previous.minutes+=minutes;
        totals.set(normalized,previous);
      });
    });
  });
  const ranked=[...totals.values()].sort((a,b)=>b.minutes-a.minutes||a.name.localeCompare(b.name,'fr-CA'));
  const best=ranked[0]?.minutes;
  return {leaders:ranked.filter(item=>item.minutes===best),missing};
}
export function reportMetricsForDates(reports,dates){
  const result={jcl:{minutes:0,km:0,teams:0,incomplete:0,missingHours:0,missingKm:0},comptec:{minutes:0,km:0,teams:0,incomplete:0,missingHours:0,missingKm:0}};
  dates.forEach(date=>(reports?.[date]?.teams||[]).forEach(team=>{
    const employees=team?.employees||[];if(!employees.length)return;
    const metric=result[groupFor(team)];metric.teams++;let incomplete=false;
    employees.forEach(employee=>{const minutes=minutesWorked(employee);if(minutes===null){metric.missingHours++;incomplete=true}else metric.minutes+=minutes});
    const raw=team?.distance;if(raw===''||raw===undefined||raw===null||!Number.isFinite(Number(raw))||Number(raw)<0){metric.missingKm++;incomplete=true}else metric.km+=Number(raw);
    if(incomplete)metric.incomplete++;
  }));
  return result;
}
export function topDriversForReportDates(reports,dates){
  const totals=new Map();let missing=0;
  dates.forEach(date=>(reports?.[date]?.teams||[]).forEach(team=>{
    if(!(team?.employees||[]).length&&!team?.distance)return;
    const name=String(team?.chauffeur||team?.driverName||team?.driver||'').trim().replace(/\s+/g,' '),raw=team?.distance;
    if(!name||raw===''||raw===undefined||raw===null||!Number.isFinite(Number(raw))||Number(raw)<0){missing++;return}
    const key=name.toLocaleLowerCase('fr-CA'),previous=totals.get(key)||{name,km:0};previous.km+=Number(raw);totals.set(key,previous);
  }));
  const ranked=[...totals.values()].sort((a,b)=>b.km-a.km||a.name.localeCompare(b.name,'fr-CA')),best=ranked[0]?.km;
  return {leaders:ranked.filter(item=>item.km===best),missing};
}
export function topEmployeesByHoursForDates(reports,dates){
  const totals=new Map();let missing=0;
  dates.forEach(date=>(reports?.[date]?.teams||[]).forEach(team=>(team?.employees||[]).forEach(employee=>{
    const name=String(employee?.name||'').trim().replace(/\s+/g,' ');if(!name)return;
    const minutes=minutesWorked(employee);if(minutes===null){missing++;return}
    const key=name.toLocaleLowerCase('fr-CA'),previous=totals.get(key)||{name,minutes:0};previous.minutes+=minutes;totals.set(key,previous);
  })));
  const ranked=[...totals.values()].sort((a,b)=>b.minutes-a.minutes||a.name.localeCompare(b.name,'fr-CA')),best=ranked[0]?.minutes;
  return {leaders:ranked.filter(item=>item.minutes===best),missing};
}
export function changePercent(current,previous){return previous>0?((current-previous)/previous)*100:null}
