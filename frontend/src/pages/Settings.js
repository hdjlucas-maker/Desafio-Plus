import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ display_name: user?.display_name || '', bio: user?.bio || '', privacy: user?.privacy || 'public' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await usersAPI.updateProfile(form);
      updateUser(data);
      toast.success('Perfil atualizado!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>⚙️ Configurações</h1>
      <div className="card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Editar Perfil</h2>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[['Nome', 'display_name', 'text'], ['Bio', 'bio', 'text']].map(([label, name, type]) => (
            <div key={name}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{label}</label>
              <input className="input" type={type} value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Privacidade</label>
            <select className="input" value={form.privacy} onChange={e => setForm(p => ({ ...p, privacy: e.target.value }))}>
              <option value="public">🌐 Público</option>
              <option value="private">🔒 Privado</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
        </form>
      </div>
    </div>
  );
}
