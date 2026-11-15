const SUPABASE_URL = 'https://hgistzlftkkhdhdwnssl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_X80y2fe5DFoZE2mGufRNHA_LhfvWHsF';
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const loginError = document.querySelector('#loginError');

document.querySelector('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  const formData = new FormData(event.currentTarget);
  const { data, error } = await client.auth.signInWithPassword({ email: formData.get('email'), password: formData.get('password') });
  if (error) {
    loginError.textContent = 'Sign in failed. Check your email and password.';
    return;
  }
  window.location.href = 'dashboard.html';
});
