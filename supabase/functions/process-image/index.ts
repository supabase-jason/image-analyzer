import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the webhook payload
    const payload = await req.json();
    console.log('Webhook payload:', payload);

    const { record } = payload;
    if (!record) {
      throw new Error('No record in payload');
    }

    const { name: filePath, bucket_id } = record;
    
    // Extract user_id from file path (format: user_id/filename)
    const userId = filePath.split('/')[0];
    
    // Get the image from storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from(bucket_id)
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading image:', downloadError);
      throw downloadError;
    }

    // Convert to base64
    const arrayBuffer = await imageData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = imageData.type || 'image/jpeg';
    const base64Image = `data:${mimeType};base64,${base64}`;

    console.log('Calling Lovable AI for image analysis...');

    // Call Lovable AI with vision capabilities for description and color analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and provide: 1) A detailed description (2-3 sentences), 2) The 5 most dominant colors as hex codes. Respond in JSON format: {"description": "...", "colors": ["#hex1", "#hex2", ...]}',
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', aiData);
    
    const aiContent = JSON.parse(aiData.choices[0].message.content);
    const { description, colors } = aiContent;

    console.log('Generating embedding...');

    // Generate embedding using the description
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: description,
      }),
    });

    let embedding = null;
    if (embeddingResponse.ok) {
      const embeddingData = await embeddingResponse.json();
      embedding = embeddingData.data[0].embedding;
      console.log('Embedding generated successfully');
    } else {
      console.warn('Failed to generate embedding, continuing without it');
    }

    // Insert metadata into database
    const fileName = filePath.split('/').pop() || filePath;
    
    const { data: insertData, error: insertError } = await supabase
      .from('images')
      .insert({
        user_id: userId,
        file_path: filePath,
        file_name: fileName,
        description,
        color_palette: colors,
        embedding,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting metadata:', insertError);
      throw insertError;
    }

    console.log('Image processed successfully:', insertData);

    return new Response(
      JSON.stringify({ success: true, data: insertData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
