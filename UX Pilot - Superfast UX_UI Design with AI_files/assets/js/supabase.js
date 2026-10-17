const BizConnectSupabase = (() => {
  const config = {
    url: window.BIZCONNECT_SUPABASE_URL || '',
    anonKey: window.BIZCONNECT_SUPABASE_ANON_KEY || ''
  };

  const isConfigured = Boolean(config.url && config.anonKey);

  return {
    isConfigured,
    getClient() {
      if (!isConfigured || !window.supabase) {
        return null;
      }

      return window.supabase.createClient(config.url, config.anonKey);
    },
    async signUp({ email, password, fullName, role }) {
      const client = this.getClient();
      if (!client) return { client: null, data: null, error: null };
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } }
      });
      return { client, data, error };
    },
    async signIn({ email, password }) {
      const client = this.getClient();
      if (!client) return { client: null, data: null, error: null };
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      return { client, data, error };
    },
    async createBusiness(fields) {
      const client = this.getClient();
      if (!client) return { client: null, data: null, error: null };
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData.user) return { client, data: null, error: authError || new Error('Please sign in before registering a business.') };
      const { data, error } = await client.from('businesses').insert({
        owner_id: authData.user.id,
        name: fields.name,
        category: fields.category,
        location: fields.location,
        description: fields.description
      }).select().single();
      return { client, data, error };
    }
  };
})();

window.BizConnectSupabase = BizConnectSupabase;
