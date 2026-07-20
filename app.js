const tasks=[
  ['Build your base resume','Create one strong, ATS-friendly resume to use as your foundation.'],
  ['Add your first job','Save a role to start tracking your applications.'],
  ['Complete your profile','Help us personalize your job-search experience.'],
  ['Practice an interview','Get comfortable answering common interview questions.']
];
const initialJobs=[
  {title:'Product Designer',company:'Northstar Labs',stage:'Saved'},
  {title:'UX Researcher',company:'Brightline',stage:'Saved'},
  {title:'Senior Product Designer',company:'Orbit',stage:'Applied'},
  {title:'Design Systems Lead',company:'Canvas',stage:'Interviewing'},
  {title:'Product Designer',company:'Aperture',stage:'Offer'}
];
let jobs=JSON.parse(localStorage.getItem('compass-jobs')||'null')||initialJobs;
let completed=JSON.parse(localStorage.getItem('compass-tasks')||'[]');
const stages=['Saved','Applied','Interviewing','Offer'];
const save=()=>localStorage.setItem('compass-jobs',JSON.stringify(jobs));
function renderTasks(){const root=document.querySelector('#task-list');root.innerHTML=tasks.map((t,i)=>`<div class="task"><input class="task-check" type="checkbox" data-task="${i}" ${completed.includes(i)?'checked':''}><div class="task-content"><b>${t[0]}</b><p>${t[1]}</p></div><button data-go="${['resumes','tracker','dashboard','interview'][i]}">${completed.includes(i)?'Done':'Get started'} →</button></div>`).join('');const n=completed.length;document.querySelector('#done-count').textContent=n;document.querySelector('#percent').textContent=`${n*25}%`;document.querySelector('#progress-bar').style.width=`${n*25}%`}
function renderBoard(query=''){const board=document.querySelector('#board');board.innerHTML=stages.map(stage=>{const list=jobs.filter(j=>j.stage===stage&&(`${j.title} ${j.company}`).toLowerCase().includes(query.toLowerCase()));return `<div class="column" data-stage="${stage}"><div class="column-head">${stage}<span>${list.length}</span></div><div class="dropzone">${list.map(j=>`<article class="job-card" draggable="true" data-id="${jobs.indexOf(j)}"><div class="company-icon">${j.company.slice(0,2).toUpperCase()}</div><h3>${j.title}</h3><p>${j.company}</p><small>Added today</small></article>`).join('')}</div></div>`}).join('');setupDrag()}
function setupDrag(){let dragged;document.querySelectorAll('.job-card').forEach(card=>{card.addEventListener('dragstart',()=>{dragged=card;card.classList.add('dragging')});card.addEventListener('dragend',()=>card.classList.remove('dragging'))});document.querySelectorAll('.column').forEach(col=>{col.addEventListener('dragover',e=>e.preventDefault());col.addEventListener('drop',e=>{e.preventDefault();if(!dragged)return;jobs[dragged.dataset.id].stage=col.dataset.stage;save();renderBoard(document.querySelector('#job-search').value)})})}
function showPage(id){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active-page'));document.querySelector(`#${id}`).classList.add('active-page');document.querySelectorAll('.nav-link').forEach(x=>x.classList.toggle('active',x.dataset.page===id));document.querySelector('#page-title').textContent=document.querySelector(`[data-page="${id}"]`)?.textContent.trim()||id;document.querySelector('.sidebar').classList.remove('open')}
document.addEventListener('click',e=>{const target=e.target.closest('[data-go],[data-page]');if(target)showPage(target.dataset.go||target.dataset.page);if(e.target.matches('.task-check')){let i=+e.target.dataset.task;completed=e.target.checked?[...completed,i]:completed.filter(x=>x!==i);localStorage.setItem('compass-tasks',JSON.stringify(completed));renderTasks()} });
document.querySelector('#add-job').onclick=()=>document.querySelector('#job-dialog').showModal();
document.querySelector('#job-form').addEventListener('submit',e=>{if(e.submitter.value==='cancel')return;e.preventDefault();let data=new FormData(e.target);jobs.unshift({title:data.get('title'),company:data.get('company'),stage:data.get('stage')});save();renderBoard();e.target.reset();document.querySelector('#job-dialog').close();showPage('tracker')});
document.querySelector('#job-search').oninput=e=>renderBoard(e.target.value);
document.querySelector('#clear-jobs').onclick=()=>{if(confirm('Remove all jobs from your tracker?')){jobs=[];save();renderBoard()}};
document.querySelector('#new-resume').onclick=()=>document.querySelector('#resume-created').textContent='Your new resume is ready to edit.';
document.querySelector('#new-contact').onclick=()=>{const name=prompt('Contact name');if(name){document.querySelector('#contact-list').insertAdjacentHTML('beforeend',`<div class="contact"><span>${name.slice(0,2).toUpperCase()}</span><b>${name}</b></div>`)}};
document.querySelector('#menu').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');
renderTasks();renderBoard();
