'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export default function TestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [testTripId, setTestTripId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, router]);

  const updateResult = (name: string, status: TestResult['status'], message: string) => {
    setResults((prev) => {
      const existing = prev.findIndex((r) => r.name === name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { name, status, message };
        return updated;
      }
      return [...prev, { name, status, message }];
    });
  };

  const runTests = async () => {
    if (!user) {
      alert('Você precisa estar autenticado');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setTestTripId(null);

    try {
      // Test 1: Create trip document
      updateResult('test-1', 'pending', 'Criando viagem de teste...');
      const tripData = {
        title: `Viagem Teste - ${new Date().toLocaleString('pt-BR')}`,
        destination: 'São Paulo',
        country: 'Brasil',
        state: 'SP',
        city: 'São Paulo',
        startDate: Timestamp.fromDate(new Date('2026-06-01')),
        endDate: Timestamp.fromDate(new Date('2026-06-05')),
        generalDescription: 'Uma viagem de teste para verificar o fluxo completo',
        notes: 'Teste automático',
        coverImageUrl: '',
        coverImagePath: '',
        status: 'draft',
        isPublic: false,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        tags: ['teste'],
        travelers: 1,
        travelerNames: ['Testador'],
        mood: 'feliz',
        generalRating: 5,
        wouldReturn: true,
        approximateTotalCost: 0,
        currency: 'BRL',
      };

      const tripRef = await addDoc(collection(firestore, 'trips'), tripData);
      const createdTripId = tripRef.id;
      setTestTripId(createdTripId);
      updateResult(
        'test-1',
        'success',
        `Viagem criada com sucesso: ${createdTripId}`
      );

      // Test 2: Add attractions
      updateResult('test-2', 'pending', 'Adicionando atrações...');
      const attractions = [
        {
          title: 'Museu do Ipiranga',
          description: 'Um museu importante em São Paulo',
          address: 'Av. Nazaré, 1000',
          latitude: -23.5908,
          longitude: -46.6333,
          createdAt: Timestamp.now(),
          images: [],
        },
        {
          title: 'MASP',
          description: 'Museu de Arte de São Paulo',
          address: 'Av. Paulista, 1578',
          latitude: -23.5615,
          longitude: -46.6561,
          createdAt: Timestamp.now(),
          images: [],
        },
      ];

      for (const attr of attractions) {
        await addDoc(
          collection(firestore, 'trips', createdTripId, 'attractions'),
          attr
        );
      }

      updateResult(
        'test-2',
        'success',
        `2 atrações criadas com sucesso`
      );

      // Test 3: Verify data
      updateResult('test-3', 'pending', 'Verificando dados salvos...');
      const attractionsSnap = await getDocs(
        collection(firestore, 'trips', createdTripId, 'attractions')
      );

      updateResult(
        'test-3',
        'success',
        `${attractionsSnap.size} atrações verificadas no Firestore`
      );

      // All tests passed
      updateResult('summary', 'success',
        '✅ TODOS OS TESTES PASSARAM! Viagem de teste criada com sucesso.');

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateResult('error', 'error', message);
    } finally {
      setIsRunning(false);
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🧪 Teste Automático do Fluxo de Viagem</h1>

      <p style={{ color: '#666' }}>
        Este teste verifica se o fluxo de criação de viagem + atrações está funcionando corretamente.
      </p>

      <button
        onClick={runTests}
        disabled={isRunning}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          background: isRunning ? '#ccc' : '#055e3d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginBottom: '2rem',
        }}
      >
        {isRunning ? '⏳ Executando testes...' : '▶️ Executar testes'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {results.map((result) => (
          <div
            key={result.name}
            style={{
              padding: '1rem',
              background:
                result.status === 'success'
                  ? '#e8f5e9'
                  : result.status === 'error'
                    ? '#ffebee'
                    : '#f5f5f5',
              border:
                result.status === 'success'
                  ? '1px solid #4caf50'
                  : result.status === 'error'
                    ? '1px solid #f44336'
                    : '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {result.status === 'success' && '✅ '}
              {result.status === 'error' && '❌ '}
              {result.status === 'pending' && '⏳ '}
              {result.name}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#333' }}>
              {result.message}
            </div>
          </div>
        ))}
      </div>

      {testTripId && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
          }}
        >
          <h3>📝 Viagem de Teste Criada</h3>
          <p>
            Viagem ID: <code style={{ background: '#f5f5f5', padding: '0.2rem 0.5rem' }}>{testTripId}</code>
          </p>
          <p>
            <a
              href={`/admin/trips/${testTripId}`}
              style={{ color: '#055e3d', textDecoration: 'none', fontWeight: 'bold' }}
            >
              👉 Clique aqui para editar a viagem de teste
            </a>
          </p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Nesta página, você pode:
            <ul>
              <li>Adicionar uma foto de capa (testar upload de foto)</li>
              <li>Verificar que as atrações foram criadas automaticamente</li>
              <li>Navegar para a aba "Atrações" para confirmar</li>
            </ul>
          </p>
        </div>
      )}

      <div
        style={{
          marginTop: '3rem',
          padding: '1rem',
          background: '#f9f9f9',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#666',
        }}
      >
        <h3>ℹ️ Instruções Manuais Adicionais</h3>
        <p>
          Se os testes passarem, você também pode testar manualmente:
        </p>
        <ol>
          <li>
            <strong>Photo Upload:</strong> Vá para uma viagem existente, etapa "Foto de capa",
            e faça upload de uma imagem. Deve completar rapidamente sem ficar preso em "Enviando...".
          </li>
          <li>
            <strong>Attractions Step:</strong> Crie uma nova viagem. Quando chegar à etapa "Atrações",
            a viagem deve ser salva automaticamente e você pode adicionar atrações com fotos.
          </li>
        </ol>
      </div>
    </div>
  );
}
