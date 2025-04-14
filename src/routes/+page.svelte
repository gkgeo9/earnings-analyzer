<script>
  import { analyzeEarningsCall, getAvailableQuarters } from '$lib/api';
  
  let ticker = '';
  let year = new Date().getFullYear();
  let quarter = 1;
  let forceRefresh = false;
  let loading = false;
  let error = null;
  let analysis = null;
  let availableQuarters = [];
  
  // When ticker changes, update available quarters
  async function handleTickerChange() {
    if (ticker && ticker.length >= 2) {
      availableQuarters = await getAvailableQuarters(ticker);
    }
  }
  
  // Submit form and analyze earnings
  async function handleSubmit() {
    if (!ticker) {
      error = 'Please enter a ticker symbol';
      return;
    }
    
    try {
      error = null;
      loading = true;
      
      // Convert ticker to uppercase
      const formattedTicker = ticker.toUpperCase();
      
      // Analyze earnings call
      analysis = await analyzeEarningsCall(formattedTicker, year, quarter, forceRefresh);
      
      // Update available quarters
      handleTickerChange();
      
    } catch (err) {
      error = err.message || 'Analysis failed';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<main>
  <div class="app-container">
    <h1>Earnings Call Insight Engine</h1>
    
    <!-- Analysis Form -->
    <div class="form-container glass-card">
      <h2 class="glass-header">Analyze Earnings Call</h2>
      
      {#if error}
        <div class="error-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line></svg>
          {error}
        </div>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="ticker">Ticker Symbol</label>
          <input 
            id="ticker" 
            class="glass-input"
            type="text" 
            bind:value={ticker} 
            on:blur={handleTickerChange}
            placeholder="e.g., MSFT" 
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="year">Year</label>
            <select id="year" class="glass-select" bind:value={year}>
              {#each Array.from({length: 5}, (_, i) => new Date().getFullYear() - i) as yearOption}
                <option value={yearOption}>{yearOption}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="quarter">Quarter</label>
            <select id="quarter" class="glass-select" bind:value={quarter}>
              {#each [1, 2, 3, 4] as q}
                <option value={q}>Q{q}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={forceRefresh} />
            <span class="checkbox-text">Force refresh (bypass cache)</span>
          </label>
        </div>
        
        <button type="submit" class="glass-button" disabled={loading}>
          {#if loading}
            <span class="loading-spinner"></span>
            Analyzing...
          {:else}
            Analyze Earnings Call
          {/if}
        </button>
      </form>
      
      <!-- Available cached analyses -->
      {#if availableQuarters.length > 0}
        <div class="cached-analyses">
          <h3>Available cached analyses</h3>
          <ul class="quarters-list">
            {#each availableQuarters as yearData}
              <li>
                <span class="year-label">{yearData.year}:</span> 
                <div class="quarters-buttons">
                  {#each yearData.quarters as q}
                    <button 
                      class="glass-button glass-button-secondary glass-button-small"
                      on:click={() => {
                        year = yearData.year;
                        quarter = q;
                        handleSubmit();
                      }}
                    >
                      Q{q}
                    </button>
                  {/each}
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
    
    <!-- Analysis Results -->
    {#if analysis}
      <div class="results-container glass-card">
        <div class="results-header">
          <h2 class="glass-header">{ticker} Q{quarter} {year} Analysis</h2>
          
          <div class="badges">
            {#if analysis.fromCache !== undefined}
              <div class="glass-badge {analysis.fromCache ? 'glass-badge-blue' : 'glass-badge-green'}">
                {analysis.fromCache ? '🔄 From cache' : '🔍 Fresh analysis'}
              </div>
            {/if}
            
            {#if analysis.warning}
              <div class="glass-badge glass-badge-amber">
                ⚠️ {analysis.warning}
              </div>
            {/if}
          </div>
        </div>
        
        <div class="overall glass-section">
          <h3>Overall Assessment</h3>
          <p>{analysis.overall_assessment || 'No overall assessment available'}</p>
        </div>
        
        {#if analysis.executive_analysis}
          <div class="section glass-section">
            <h3>Executive Analysis</h3>
            <div class="metrics-container">
              <div class="metric-badge">
                <span class="metric-label">Tone</span>
                <span class="metric-value">{analysis.executive_analysis.overall_tone}</span>
              </div>
              
              <div class="metric-badge">
                <span class="metric-label">Confidence</span>
                <span class="metric-value">{analysis.executive_analysis.confidence_level}</span>
              </div>
            </div>
            
            {#if analysis.executive_analysis.key_messages?.length > 0}
              <h4>Key Messages</h4>
              <ul class="insight-list">
                {#each analysis.executive_analysis.key_messages as message}
                  <li>{message}</li>
                {/each}
              </ul>
            {/if}
            
            {#if analysis.executive_analysis.strong_claims?.length > 0}
              <h4>Strong Claims</h4>
              <ul class="insight-list">
                {#each analysis.executive_analysis.strong_claims as claim}
                  <li>{claim}</li>
                {/each}
              </ul>
            {/if}
            
            {#if analysis.executive_analysis.hedging_language?.length > 0}
              <h4>Hedging Language</h4>
              <ul class="insight-list">
                {#each analysis.executive_analysis.hedging_language as hedge}
                  <li>{hedge}</li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
        
        {#if analysis.qa_analysis}
          <div class="section glass-section">
            <h3>Q&A Analysis</h3>
            
            {#if analysis.qa_analysis.notable_insights?.length > 0}
              <h4>Notable Insights</h4>
              <ul class="insight-list">
                {#each analysis.qa_analysis.notable_insights as insight}
                  <li>{insight}</li>
                {/each}
              </ul>
            {/if}
            
            {#if analysis.qa_analysis.most_evasive_questions?.length > 0}
              <h4>Most Evasive Questions</h4>
              {#each analysis.qa_analysis.most_evasive_questions as q}
                <div class="evasive-question glass-card">
                  <p><strong>Question:</strong> "{q.question}"</p>
                  <p><strong>Asked by:</strong> {q.analyst}</p>
                  <p><strong>Directness:</strong> <span class="directness-tag">{q.directness}</span></p>
                  
                  {#if q.evasion_tactics?.length > 0}
                    <p><strong>Evasion tactics:</strong></p>
                    <ul class="tactic-list">
                      {#each q.evasion_tactics as tactic}
                        <li>{tactic}</li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        {/if}
        
        <!-- Financial Metrics -->
        {#if analysis.financial_metrics}
          <div class="section glass-section">
            <h3>Financial Metrics</h3>
            
            {#if analysis.financial_metrics.highlighted_metrics?.length > 0}
              <div class="metric-section">
                <h4>Highlighted Metrics</h4>
                <div class="metrics-grid">
                  {#each analysis.financial_metrics.highlighted_metrics as metric}
                    <div class="metric-card">
                      <span class="metric-value highlighted">{metric}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if analysis.financial_metrics.downplayed_metrics?.length > 0}
              <div class="metric-section">
                <h4>Downplayed Metrics</h4>
                <div class="metrics-grid">
                  {#each analysis.financial_metrics.downplayed_metrics as metric}
                    <div class="metric-card downplayed">
                      <span class="metric-value">{metric}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if analysis.financial_metrics.new_metrics?.length > 0}
              <div class="metric-section">
                <h4>New Metrics</h4>
                <div class="metrics-grid">
                  {#each analysis.financial_metrics.new_metrics as metric}
                    <div class="metric-card new">
                      <span class="metric-value">{metric}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Competitive Positioning -->
        {#if analysis.competitive_positioning}
          <div class="section glass-section">
            <h3>Competitive Positioning</h3>
            
            {#if analysis.competitive_positioning.mentioned_competitors?.length > 0}
              <h4>Mentioned Competitors</h4>
              <ul class="insight-list">
                {#each analysis.competitive_positioning.mentioned_competitors as competitor}
                  <li>{competitor}</li>
                {/each}
              </ul>
            {/if}
            
            {#if analysis.competitive_positioning.market_dynamics?.length > 0}
              <h4>Market Dynamics</h4>
              <ul class="insight-list">
                {#each analysis.competitive_positioning.market_dynamics as dynamic}
                  <li>{dynamic}</li>
                {/each}
              </ul>
            {/if}
            
            {#if analysis.competitive_positioning.competitive_advantages?.length > 0}
              <h4>Competitive Advantages</h4>
              <ul class="insight-list">
                {#each analysis.competitive_positioning.competitive_advantages as advantage}
                  <li>{advantage}</li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
        
        {#if analysis.forward_looking_statements?.length > 0}
          <div class="section glass-section">
            <h3>Forward-Looking Statements</h3>
            <ul class="insight-list future-list">
              {#each analysis.forward_looking_statements as statement}
                <li>{statement}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        {#if analysis.red_flags?.length > 0}
          <div class="section glass-section">
            <h3>Red Flags</h3>
            <ul class="insight-list red-flags-list">
              {#each analysis.red_flags as flag}
                <li>⚠️ {flag}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <!-- Change Analysis -->
        {#if analysis.change_analysis?.length > 0}
          <div class="section glass-section">
            <h3>Change Analysis</h3>
            <ul class="insight-list">
              {#each analysis.change_analysis as change}
                <li>{change}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <div class="export">
          <button class="glass-button glass-button-secondary" on:click={() => {
            const dataStr = JSON.stringify(analysis, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportName = `${ticker}_Q${quarter}_${year}_analysis.json`;
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', exportName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export JSON
          </button>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  /* Main container styling */
  .app-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 30px 20px;
  }
  
  main {
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--text-primary);
  }
  
  h1 {
    text-align: center;
    color: var(--primary-color);
    font-size: 2.4rem;
    font-weight: 700;
    margin-bottom: 30px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    font-size: 1.5rem;
    margin-top: 0;
  }
  
  h3 {
    font-size: 1.2rem;
    margin-top: 0;
    color: var(--primary-color);
  }
  
  h4 {
    font-size: 1rem;
    margin: 15px 0 8px;
    color: var(--text-secondary);
  }
  
  /* Form elements */
  .form-container, .results-container {
    padding: 24px;
    margin-bottom: 30px;
  }
  
  .form-group {
    margin-bottom: 18px;
  }
  
  .form-row {
    display: flex;
    gap: 16px;
  }
  
  .form-row .form-group {
    flex: 1;
  }
  
  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  /* Custom checkbox styling */
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  
  .checkbox-label input {
    appearance: none;
    width: 18px;
    height: 18px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid var(--glass-border);
    border-radius: 4px;
    cursor: pointer;
    position: relative;
  }
  
  .checkbox-label input:checked {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }
  
  .checkbox-label input:checked::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  
  .checkbox-text {
    font-size: 14px;
  }
  
  /* Loading spinner */
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Error alert */
  .error-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
  }
  
  /* Cached analyses list */
  .cached-analyses {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .cached-analyses h3 {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  
  .quarters-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .quarters-list li {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .year-label {
    font-weight: 500;
    min-width: 60px;
  }
  
  .quarters-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  /* Results container styling */
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  
  .badges {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  /* Sections styling */
  .overall {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .section {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  /* Metrics display */
  .metrics-container {
    display: flex;
    gap: 12px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }
  
  .metric-badge {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 6px 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .metric-label {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .metric-value {
    font-weight: 600;
    font-size: 14px;
  }
  
  /* Grid for metrics */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }
  
  .metric-card {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  
  .metric-card.highlighted {
    background: rgba(16, 185, 129, 0.15);
  }
  
  .metric-card.downplayed {
    background: rgba(239, 68, 68, 0.1);
  }
  
  .metric-card.new {
    background: rgba(99, 102, 241, 0.15);
  }
  
  /* Lists */
  .insight-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .insight-list li {
    position: relative;
    padding: 8px 8px 8px 24px;
    margin-bottom: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }
  
  .insight-list li::before {
    content: '•';
    position: absolute;
    left: 10px;
    color: var(--primary-color);
  }
  
  .red-flags-list li {
    background: rgba(239, 68, 68, 0.1);
  }
  
  .future-list li {
    background: rgba(99, 102, 241, 0.1);
  }
  
  /* Evasive question cards */
  .evasive-question {
    margin-bottom: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .evasive-question p {
    margin: 8px 0;
  }
  
  .directness-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    background: rgba(99, 102, 241, 0.15);
  }
  
  .tactic-list {
    list-style: none;
    padding: 0;
    margin: 8px 0 0 0;
  }
  
  .tactic-list li {
    position: relative;
    padding: 6px 6px 6px 20px;
    margin-bottom: 4px;
    font-size: 14px;
  }
  
  .tactic-list li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--accent-color);
  }
  
  /* Export button */
  .export {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
  
  .export button {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .app-container {
      padding: 20px 12px;
    }
    
    h1 {
      font-size: 1.8rem;
    }
    
    .form-row {
      flex-direction: column;
      gap: 12px;
    }
    
    .results-header {
      flex-direction: column;
      gap: 12px;
    }
    
    .badges {
      align-self: flex-start;
    }
    
    .metrics-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }
  </style>