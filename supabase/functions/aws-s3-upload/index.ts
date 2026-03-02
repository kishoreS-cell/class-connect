import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const AWS_S3_BUCKET_NAME = Deno.env.get('AWS_S3_BUCKET_NAME');
    const AWS_S3_REGION = Deno.env.get('AWS_S3_REGION');

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET_NAME || !AWS_S3_REGION) {
      throw new Error('AWS S3 credentials are not configured');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || (req.method === 'POST' ? 'upload' : 'status');

    if (action === 'status') {
      // Health check / status endpoint
      return new Response(JSON.stringify({
        connected: true,
        bucket: AWS_S3_BUCKET_NAME,
        region: AWS_S3_REGION,
        service: 'AWS S3',
        provider: 'Amazon Web Services',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      const prefix = url.searchParams.get('prefix') || '';
      const listUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=50`;
      
      const dateStamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8);
      const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
      
      // Use simple GET with query auth
      const response = await signAndFetch('GET', `${AWS_S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com`, `/?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=50`, '', AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_REGION, AWS_S3_BUCKET_NAME);
      
      const xmlText = await response.text();
      
      // Parse XML to extract file info
      const files: any[] = [];
      const contentRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
      let match;
      while ((match = contentRegex.exec(xmlText)) !== null) {
        const content = match[1];
        const key = content.match(/<Key>(.*?)<\/Key>/)?.[1] || '';
        const size = parseInt(content.match(/<Size>(.*?)<\/Size>/)?.[1] || '0');
        const lastModified = content.match(/<LastModified>(.*?)<\/LastModified>/)?.[1] || '';
        
        if (key && !key.endsWith('/')) {
          files.push({
            key,
            size,
            lastModified,
            url: `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${key}`,
          });
        }
      }

      return new Response(JSON.stringify({ files, bucket: AWS_S3_BUCKET_NAME }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'upload') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const folder = formData.get('folder') as string || 'uploads';

      if (!file) {
        throw new Error('No file provided');
      }

      const fileName = `${folder}/${Date.now()}-${file.name}`;
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);

      const host = `${AWS_S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com`;
      const path = `/${fileName}`;

      const response = await signAndFetch('PUT', host, path, fileBytes, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_REGION, AWS_S3_BUCKET_NAME, file.type);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`S3 upload failed [${response.status}]: ${errText}`);
      }

      const fileUrl = `https://${host}${path}`;

      return new Response(JSON.stringify({
        success: true,
        url: fileUrl,
        key: fileName,
        bucket: AWS_S3_BUCKET_NAME,
        size: file.size,
        contentType: file.type,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const body = await req.json();
      const { key } = body;

      if (!key) throw new Error('No file key provided');

      const host = `${AWS_S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com`;
      const path = `/${key}`;

      const response = await signAndFetch('DELETE', host, path, '', AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_REGION, AWS_S3_BUCKET_NAME);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`S3 delete failed [${response.status}]: ${errText}`);
      }

      return new Response(JSON.stringify({ success: true, deleted: key }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('AWS S3 Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// AWS Signature V4 implementation
async function signAndFetch(
  method: string,
  host: string,
  path: string,
  body: Uint8Array | string,
  accessKey: string,
  secretKey: string,
  region: string,
  bucket: string,
  contentType?: string,
): Promise<Response> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';

  const encoder = new TextEncoder();

  // Create payload hash
  let payloadHash: string;
  if (body instanceof Uint8Array) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', body);
    payloadHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(body as string));
    payloadHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const headers: Record<string, string> = {
    'host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) {
    headers['content-type'] = contentType;
  }

  const signedHeaderKeys = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${headers[k]}\n`).join('');

  // Split path and query
  const [pathname, queryString] = path.split('?');
  const canonicalQueryString = queryString || '';

  const canonicalRequest = [
    method,
    pathname,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaderKeys,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  // Derive signing key
  const kDate = await hmacSHA256(encoder.encode(`AWS4${secretKey}`), dateStamp);
  const kRegion = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  const kSigning = await hmacSHA256(kService, 'aws4_request');
  
  const signatureBytes = await hmacSHA256(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('');

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaderKeys}, Signature=${signature}`;

  const fetchHeaders: Record<string, string> = {
    ...headers,
    'Authorization': authorizationHeader,
  };

  const url = `https://${host}${path}`;
  return fetch(url, {
    method,
    headers: fetchHeaders,
    body: body instanceof Uint8Array && body.length > 0 ? body : (typeof body === 'string' && body.length > 0 ? body : undefined),
  });
}

async function hmacSHA256(key: Uint8Array | ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}
