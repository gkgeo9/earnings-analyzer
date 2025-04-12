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
  <h1>Earnings Call Insight Engine</h1>
  
  <!-- Analysis Form -->
  <div class="form-container">
    <h2>Analyze Earnings Call</h2>
    
    {#if error}
      <div class="error">{error}</div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="ticker">Ticker Symbol</label>
        <input 
          id="ticker" 
          type="text" 
          bind:value={ticker} 
          on:blur={handleTickerChange}
          placeholder="e.g., MSFT" 
        />
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="year">Year</label>
          <select id="year" bind:value={year}>
            {#each Array.from({length: 5}, (_, i) => new Date().getFullYear() - i) as yearOption}
              <option value={yearOption}>{yearOption}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="quarter">Quarter</label>
          <select id="quarter" bind:value={quarter}>
            {#each [1, 2, 3, 4] as q}
              <option value={q}>Q{q}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={forceRefresh} />
          Force refresh (bypass cache)
        </label>
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Earnings Call'}
      </button>
    </form>
    
    <!-- Available cached analyses -->
    {#if availableQuarters.length > 0}
      <div class="cached-analyses">
        <h3>Available cached analyses</h3>
        <ul>
          {#each availableQuarters as yearData}
            <li>
              {yearData.year}: 
              {#each yearData.quarters as q}
                <button 
                  class="quarter-button"
                  on:click={() => {
                    year = yearData.year;
                    quarter = q;
                    handleSubmit();
                  }}
                >
                  Q{q}
                </button>
              {/each}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
  
  <!-- Analysis Results -->
  {#if analysis}
    <div class="results-container">
      <div class="results-header">
        <h2>{ticker} Q{quarter} {year} Analysis</h2>
        
        <div class="badges">
          {#if analysis.fromCache !== undefined}
            <div class="badge {analysis.fromCache ? 'cached' : 'fresh'}">
              {analysis.fromCache ? '🔄 From cache' : '🔍 Fresh analysis'}
            </div>
          {/if}
          
          {#if analysis.warning}
            <div class="badge warning">
              ⚠️ {analysis.warning}
            </div>
          {/if}
        </div>
      </div>
      
      <div class="overall">
        <h3>Overall Assessment</h3>
        <p>{analysis.overall_assessment || 'No overall assessment available'}</p>
      </div>
      
      {#if analysis.executive_analysis}
        <div class="section">
          <h3>Executive Analysis</h3>
          <ul>
            <li><strong>Tone:</strong> {analysis.executive_analysis.overall_tone}</li>
            <li><strong>Confidence:</strong> {analysis.executive_analysis.confidence_level}</li>
          </ul>
          
          {#if analysis.executive_analysis.key_messages?.length > 0}
            <h4>Key Messages</h4>
            <ul>
              {#each analysis.executive_analysis.key_messages as message}
                <li>{message}</li>
              {/each}
            </ul>
          {/if}
          
          {#if analysis.executive_analysis.strong_claims?.length > 0}
            <h4>Strong Claims</h4>
            <ul>
              {#each analysis.executive_analysis.strong_claims as claim}
                <li>{claim}</li>
              {/each}
            </ul>
          {/if}
          
          {#if analysis.executive_analysis.hedging_language?.length > 0}
            <h4>Hedging Language</h4>
            <ul>
              {#each analysis.executive_analysis.hedging_language as hedge}
                <li>{hedge}</li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
      
      {#if analysis.qa_analysis}
        <div class="section">
          <h3>Q&A Analysis</h3>
          
          {#if analysis.qa_analysis.notable_insights?.length > 0}
            <h4>Notable Insights</h4>
            <ul>
              {#each analysis.qa_analysis.notable_insights as insight}
                <li>{insight}</li>
              {/each}
            </ul>
          {/if}
          
          {#if analysis.qa_analysis.most_evasive_questions?.length > 0}
            <h4>Most Evasive Questions</h4>
            {#each analysis.qa_analysis.most_evasive_questions as q}
              <div class="evasive-question">
                <p><strong>Question:</strong> "{q.question}"</p>
                <p><strong>Asked by:</strong> {q.analyst}</p>
                <p><strong>Directness:</strong> {q.directness}</p>
                
                {#if q.evasion_tactics?.length > 0}
                  <p><strong>Evasion tactics:</strong></p>
                  <ul>
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
      
      {#if analysis.forward_looking_statements?.length > 0}
        <div class="section">
          <h3>Forward-Looking Statements</h3>
          <ul>
            {#each analysis.forward_looking_statements as statement}
              <li>{statement}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      {#if analysis.red_flags?.length > 0}
        <div class="section">
          <h3>Red Flags</h3>
          <ul>
            {#each analysis.red_flags as flag}
              <li>{flag}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      <div class="export">
        <button on:click={() => {
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
          Export JSON
        </button>
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, sans-serif;
  }
  
  h1 {
    text-align: center;
    color: #4a6cf7;
  }
  
  .form-container, .results-container {
    background: #f5f7ff;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-row {
    display: flex;
    gap: 15px;
  }
  
  .form-row .form-group {
    flex: 1;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  input, select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  button {
    background: #4a6cf7;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background: #9eadf8;
  }
  
  .error {
    background: #ffebee;
    color: #c62828;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 15px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .checkbox-label input {
    width: auto;
  }
  
  .cached-analyses {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
  }
  
  .quarter-button {
    background: #e6f7ff;
    color: #0070f3;
    margin: 0 5px;
    padding: 5px 10px;
    border-radius: 12px;
    font-size: 12px;
  }
  
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .badges {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: flex-end;
  }
  
  .badge {
    padding: 5px 10px;
    border-radius: 12px;
    font-size: 12px;
    white-space: nowrap;
  }
  
  .badge.cached {
    background: #e6f7ff;
    color: #0070f3;
  }
  
  .badge.fresh {
    background: #f0fff4;
    color: #38a169;
  }
  
  .badge.warning {
    background: #fff5e6;
    color: #ed8936;
  }
  
  .section {
    margin: 15px 0;
    padding: 15px;
    background: white;
    border-radius: 4px;
  }
  
  .section h3 {
    margin-top: 0;
    color: #333;
  }
  
  .section h4 {
    margin: 15px 0 5px;
    color: #555;
  }
  
  .evasive-question {
    margin-bottom: 15px;
    padding: 10px;
    background: #f9f9f9;
    border-radius: 4px;
  }
  
  .evasive-question p {
    margin: 5px 0;
  }
  
  .export {
    text-align: right;
    margin-top: 20px;
  }
</style>