// Replace these with your values after creating OAuth credentials and a spreadsheet
const CLIENT_ID = 'REPLACE_WITH_CLIENT_ID.apps.googleusercontent.com';
const SPREADSHEET_ID = 'REPLACE_WITH_SPREADSHEET_ID';
const RANGE = 'Sheet1!A:A'; // appending JSON into column A

let tokenClient;
let accessToken = null;

window.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupConditionals();
  document.getElementById('signin').addEventListener('click', handleSignIn);
  document.getElementById('submit').addEventListener('click', handleSubmit);

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    callback: (resp) => {
      if (resp.error) {
        console.error(resp);
        alert('Auth error');
        return;
      }
      accessToken = resp.access_token;
      document.getElementById('signed-user').textContent = 'Signed in';
    },
  });
});

function handleSignIn() {
  if (!CLIENT_ID || CLIENT_ID.includes('REPLACE')) {
    alert('Set CLIENT_ID in script.js (See README)');
    return;
  }
  tokenClient.requestAccessToken();
}

function setupNavigation() {
  const steps = Array.from(document.querySelectorAll('.step'));
  let idx = 0;
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const submit = document.getElementById('submit');

  function show() {
    steps.forEach((s, i) => s.classList.toggle('visible', i === idx));
    prev.disabled = idx === 0;
    next.classList.toggle('hidden', idx === steps.length - 1);
    submit.classList.toggle('hidden', idx !== steps.length - 1);
  }
  show();
  prev.addEventListener('click', () => { idx = Math.max(0, idx - 1); show(); });
  next.addEventListener('click', () => { idx = Math.min(steps.length - 1, idx + 1); show(); });
}

function setupConditionals() {
  document.getElementsByName('has_degree').forEach(r => r.addEventListener('change', e => {
    document.getElementById('degree_fields').classList.toggle('hidden', e.target.value !== 'yes');
  }));
  document.getElementsByName('has_work').forEach(r => r.addEventListener('change', e => {
    document.getElementById('work_fields').classList.toggle('hidden', e.target.value !== 'yes');
  }));

  document.querySelectorAll('.subject-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const name = cb.getAttribute('data-subject');
      const details = document.querySelector(`.subject-details[data-for="${name}"]`);
      details.classList.toggle('hidden', !cb.checked);
    });
  });

  // per-subject inner choices
  document.querySelectorAll('.update-choice').forEach(sel => sel.addEventListener('change', e => {
    const t = sel.closest('.subject-details').querySelector('.update-text');
    t.classList.toggle('hidden', sel.value !== 'yes');
  }));
  document.querySelectorAll('.delete-choice').forEach(sel => sel.addEventListener('change', e => {
    const t = sel.closest('.subject-details').querySelector('.delete-text');
    t.classList.toggle('hidden', sel.value !== 'yes');
  }));
  document.querySelectorAll('.move-choice').forEach(sel => sel.addEventListener('change', e => {
    const d = sel.closest('.subject-details').querySelector('.move-details');
    d.classList.toggle('hidden', sel.value !== 'yes');
  }));
}

function gatherFormData() {
  const data = {};
  data.fullname = document.getElementById('fullname').value;
  data.profession = document.getElementById('profession').value;
  data.cert_giver = document.getElementById('cert_giver').value;
  data.cert_date = document.getElementById('cert_date').value;

  data.has_degree = document.querySelector('input[name="has_degree"]:checked')?.value || 'no';
  if (data.has_degree === 'yes') {
    data.degree = {
      highest: document.getElementById('highest_degree').value,
      profession: document.getElementById('degree_profession').value,
      institute: document.getElementById('degree_institute').value,
      date: document.getElementById('degree_date').value,
    };
  }

  data.has_work = document.querySelector('input[name="has_work"]:checked')?.value || 'no';
  if (data.has_work === 'yes') {
    data.work = {
      location: document.getElementById('work_location').value,
      institute: document.getElementById('work_institute').value,
      title: document.getElementById('job_title').value,
      relation: document.getElementById('work_relation').value,
    };
  }

  // Year1 subjects (sample)
  data.year1 = { sem1: [] };
  document.querySelectorAll('.subject').forEach(s => {
    const cb = s.querySelector('.subject-checkbox');
    if (!cb) return;
    const name = cb.getAttribute('data-subject');
    if (cb.checked) {
      const details = s.querySelector('.subject-details');
      data.year1.sem1.push({
        subject: name,
        pros: details.querySelector('.pros').value,
        cons: details.querySelector('.cons').value,
        update: details.querySelector('.update-choice').value,
        update_text: details.querySelector('.update-text').value,
        delete: details.querySelector('.delete-choice').value,
        delete_text: details.querySelector('.delete-text').value,
        move: details.querySelector('.move-choice').value,
        move_details: details.querySelector('.move-details').classList.contains('hidden') ? null : {
          year: details.querySelector('.move-year').value,
          sem: details.querySelector('.move-sem').value,
          reason: details.querySelector('.move-reason').value,
        }
      });
    }
  });
  data.new_subject_suggestion = document.getElementById('new_subject_suggestion').value;
  return data;
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!accessToken) {
    alert('Please sign in with Google first.');
    return;
  }
  const data = gatherFormData();
  try {
    await appendToSheet(JSON.stringify(data));
    alert('Submitted. Thank you!');
  } catch (err) {
    console.error(err);
    alert('Submission failed. See console for details.');
  }
}

async function appendToSheet(jsonStr) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}:append?valueInputOption=RAW`;
  const body = { values: [[jsonStr]] };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Sheets API error: ' + await res.text());
}
