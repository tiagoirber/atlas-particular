# 🏗️ ATLAS PARTICULAR v2: ARQUITETURA ROBUSTA

## Visão Geral

**v2** é uma rewrite focada em **sincronização em tempo real, validação forte, e escalabilidade**.

```
┌─────────────┐
│   Firestore │
│  (Listeners │
│   + Indexes)│
└──────┬──────┘
       │ onSnapshot() + Transactions
       │
┌──────▼──────────────────────┐
│   React Query (Server State) │
│ - Cache com 5min TTL         │
│ - Background refetch         │
│ - Offline queue              │
└──────┬──────────────────────┘
       │ useQuery() / useMutation()
       │
┌──────▼──────────────────────┐
│    Components (simplified)   │
│ - Delegam estado para Query  │
│ - Sem useState pra data      │
│ - Apenas UI state            │
└──────────────────────────────┘
```

---

## 1. CAMADA DE SINCRONIZAÇÃO

### Firestore Listeners (não mais getDocs)

```typescript
// lib/firestore-listeners.ts (NEW)
import { onSnapshot, query, collection, where, orderBy } from "firebase/firestore";
import type { Unsubscribe } from "firebase/database";

export function subscribeToTrips(
  userId: string,
  onData: (trips: TripDoc[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(firestore, "trips"),
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const trips = snapshot.docs.map((doc) => 
      tripFromSnapshot(doc.id, doc.data())
    );
    onData(trips);
  }, onError);
}

// Cleanup em custom hook
export function useTripsRealtime(userId: string | undefined) {
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToTrips(
      userId,
      (trips) => setTrips(trips),
      (err) => setError(err)
    );

    return () => unsubscribe();  // ✅ Cleanup automático
  }, [userId]);

  return { trips, error };
}
```

### Transações para Auto-Save

```typescript
// lib/trips-service.ts (UPDATED)
import { transaction, writeBatch } from "firebase/firestore";

export async function createAttractionWithPhotos(
  tripId: string,
  attractionData: AttractionFormData,
  coverFile?: File
): Promise<string> {
  // ✅ Transação: ou cria tudo, ou nada
  const docRef = await transaction(firestore, async (txn) => {
    // 1. Criar atração
    const attrRef = doc(collection(firestore, `trips/${tripId}/attractions`));
    txn.set(attrRef, {
      ...sanitizeAttraction(attractionData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Upload de cover se existe
    if (coverFile) {
      const { url, storagePath } = await uploadAttractionCover(
        tripId,
        attrRef.id,
        coverFile
      );
      txn.update(attrRef, {
        coverImageUrl: url,
        coverImagePath: storagePath,
      });
    }

    return attrRef;
  });

  return docRef.id;
}
```

---

## 2. CAMADA DE VALIDAÇÃO

### Runtime Validation com Zod

```typescript
// types/schemas.ts (NEW)
import { z } from "zod";
import { Timestamp } from "firebase/firestore";

export const TripSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  destination: z.string().min(1, "Destino obrigatório").max(100),
  country: z.string().min(1, "País obrigatório").max(100),
  state: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  startDate: z.instanceof(Date, { message: "Data inválida" }),
  endDate: z.instanceof(Date, { message: "Data inválida" }),
  generalDescription: z.string().max(5000).optional().nullable(),
  status: z.enum(["draft", "published"]),
  isPublic: z.boolean(),
  coverImageUrl: z.string().url().optional().nullable(),
  coverImagePath: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20),
  travelers: z.number().int().min(1).max(100),
  travelerNames: z.array(z.string().max(100)).max(100),
});

export type Trip = z.infer<typeof TripSchema>;

// Uso em service
export async function createTrip(userId: string, data: unknown): Promise<string> {
  // ✅ Validar antes de salvar
  const validated = TripSchema.parse(data);
  
  const docRef = await addDoc(collection(firestore, "trips"), {
    ...validated,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}
```

### Cloud Functions para Validação Backend

```typescript
// functions/src/validators/trip.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

const TripSchema = z.object({
  title: z.string().min(1).max(200),
  // ... mesmo schema
});

export const onTripWrite = functions.firestore
  .document("trips/{tripId}")
  .onWrite(async (change, context) => {
    const data = change.after.data();

    try {
      TripSchema.parse(data);
    } catch (e) {
      // ❌ Rejeitar write se inválido
      await change.after.ref.delete();
      console.error("Invalid trip data:", e);
    }
  });
```

---

## 3. CAMADA DE CACHE & QUERIES

### React Query em vez de custom hooks

```typescript
// hooks/queries.ts (REPLACES useTrips.ts, useDays.ts, etc)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTrips, createTrip, updateTrip } from "@/lib/trips-service";

const TRIPS_QUERY_KEY = ["trips"];

export function useTripsQuery() {
  return useQuery({
    queryKey: TRIPS_QUERY_KEY,
    queryFn: () => listTrips(),
    staleTime: 1000 * 60 * 5,  // 5min cache
    retry: 3,  // ✅ Retry automático
    gcTime: 1000 * 60 * 10,  // Garbage collect após 10min
  });
}

export function useCreateTripMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TripFormData) => createTrip(currentUserId, data),
    onSuccess: () => {
      // ✅ Invalidar cache após sucesso
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY });
    },
    retry: 2,
    onError: (error) => {
      console.error("Failed to create trip:", error);
      // Toast error
    },
  });
}

// Uso em componente
export function Dashboard() {
  const { data: trips = [], isLoading, error } = useTripsQuery();
  const createTrip = useCreateTripMutation();

  return (
    <>
      {isLoading && <Spinner />}
      {error && <ErrorAlert error={error} />}
      <TripList trips={trips} />
    </>
  );
}
```

---

## 4. COMPONENTES SIMPLIFICADOS

### Decomposição de TripFormWizard

```
TripFormWizard (800 linhas) ❌
  │
  ├─ StepIndicator.tsx
  ├─ WizardSteps.tsx
  │   ├─ BasicsStep.tsx
  │   ├─ DatesStep.tsx
  │   ├─ DescriptionStep.tsx
  │   ├─ CoverStep.tsx
  │   ├─ AttractionsStep.tsx
  │   ├─ TagsStep.tsx
  │   └─ ReviewStep.tsx
  └─ useWizardForm.ts (hook compartilhado)
```

Cada step é independente:

```typescript
// components/trips/steps/BasicsStep.tsx
interface BasicsStepProps {
  form: TripFormData;
  onUpdate: <K extends keyof TripFormData>(key: K, value: TripFormData[K]) => void;
  disabled: boolean;
}

export function BasicsStep({ form, onUpdate, disabled }: BasicsStepProps) {
  return (
    <fieldset disabled={disabled}>
      <label>Título *</label>
      <input
        value={form.title}
        onChange={(e) => onUpdate("title", e.target.value)}
        maxLength={200}
      />
      {/* Validação via Zod no submit, não aqui */}
    </fieldset>
  );
}
```

Main wizard fica lean:

```typescript
// components/trips/TripFormWizard.tsx (v2: 200 linhas)
export function TripFormWizard({ trip }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(() => trip ? fromTrip(trip) : emptyForm());
  
  const createMutation = useCreateTripMutation();
  const updateMutation = useUpdateTripMutation();

  const handleSubmit = async () => {
    if (trip) {
      await updateMutation.mutateAsync(form);
    } else {
      await createMutation.mutateAsync(form);
    }
  };

  const steps = [
    <BasicsStep form={form} onUpdate={update} disabled={createMutation.isPending} />,
    <DatesStep form={form} onUpdate={update} disabled={createMutation.isPending} />,
    <DescriptionStep form={form} onUpdate={update} disabled={createMutation.isPending} />,
    <CoverStep form={form} onUpdate={update} disabled={createMutation.isPending} />,
    <AttractionsStep tripId={trip?.id || ""} />,
    <TagsStep form={form} onUpdate={update} disabled={createMutation.isPending} />,
    <ReviewStep form={form} onSubmit={handleSubmit} />,
  ];

  return (
    <div>
      <StepIndicator current={currentStep} total={steps.length} />
      {steps[currentStep]}
      <Navigation
        onPrev={() => setCurrentStep(c => c - 1)}
        onNext={() => setCurrentStep(c => c + 1)}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
```

---

## 5. PERFORMANCE: PAGINAÇÃO

### Virtual Scroll + Infinite Query

```typescript
// hooks/queries.ts
export function useTripsInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: TRIPS_QUERY_KEY,
    queryFn: ({ pageParam = 0 }) => listTripsPage(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    initialPageParam: 0,
  });
}

// components/TripsGrid.tsx
import { useVirtualizer } from "@tanstack/react-virtual";

export function TripsGridVirtual() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = useTripsInfiniteQuery();

  const allTrips = data?.pages.flatMap((p) => p) ?? [];

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allTrips.length + 1 : allTrips.length,
    getScrollElement: () => scrollingElement,
    estimateSize: () => 300,
    overscan: 5,
  });

  return (
    <div ref={scrollingElement} style={{ height: "100vh", overflow: "auto" }}>
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const trip = allTrips[virtualItem.index];
        if (!trip) {
          return (
            <div key={`loading-${virtualItem.index}`} onVisible={() => fetchNextPage()}>
              <Spinner />
            </div>
          );
        }
        return <TripCard key={trip.id} trip={trip} />;
      })}
    </div>
  );
}
```

---

## 6. OFFLINE MODE

### IndexedDB Cache

```typescript
// lib/offline-cache.ts (NEW)
import Dexie, { Table } from "dexie";

class OfflineDB extends Dexie {
  trips!: Table<TripDoc>;
  syncQueue!: Table<{ id: string; action: "create" | "update" | "delete"; data: unknown }>;

  constructor() {
    super("AtlasParticular");
    this.version(1).stores({
      trips: "id",
      syncQueue: "id",
    });
  }
}

const db = new OfflineDB();

// Salvar dados localmente quando offline
export async function cacheTripsLocally(trips: TripDoc[]) {
  await db.trips.bulkPut(trips);
}

// Queue para sync quando voltar online
export async function queueOfflineChange(
  action: "create" | "update" | "delete",
  data: unknown
) {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    action,
    data,
  });
}

// Sincronizar quando volta online
window.addEventListener("online", async () => {
  const queue = await db.syncQueue.toArray();
  for (const item of queue) {
    try {
      if (item.action === "create") await createTrip(currentUserId, item.data);
      if (item.action === "update") await updateTrip(item.id, item.data);
      if (item.action === "delete") await deleteTrip(item.id);
      await db.syncQueue.delete(item.id);
    } catch (e) {
      console.error("Sync failed:", e);
    }
  }
});
```

---

## 7. TRATAMENTO DE ERROS & RETRY

### Retry com Exponential Backoff

```typescript
// lib/retry.ts (NEW)
export async function withRetry<T>(
  fn: () => Promise<T>,
  options = { maxRetries: 3, baseDelay: 1000 }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;

      // Não retry se erro é client-side (validation)
      if (e instanceof ValidationError) throw e;

      // Exponential backoff: 1s, 2s, 4s, 8s
      const delay = options.baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Uso
export async function createTripSafe(userId: string, data: TripFormData) {
  return withRetry(
    () => createTrip(userId, data),
    { maxRetries: 3, baseDelay: 1000 }
  );
}
```

---

## 8. CONFLICT RESOLUTION

### Multi-User Edit Detection

```typescript
// lib/firestore.ts
export async function updateTripWithConflictDetection(
  tripId: string,
  updates: Partial<TripDoc>,
  expectedLastModified: Date
): Promise<{ success: boolean; conflict?: TripDoc }> {
  try {
    const docRef = doc(firestore, "trips", tripId);
    
    // ✅ Transação com precondição
    await transaction(firestore, async (txn) => {
      const current = await txn.get(docRef);
      const currentData = current.data() as TripDoc;

      // Se outro usuário modificou depois que você leu, abort
      if (currentData.updatedAt > expectedLastModified) {
        throw new Error("CONFLICT");
      }

      txn.update(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true };
  } catch (e) {
    if (e.message === "CONFLICT") {
      const latest = await getTrip(tripId);
      return { success: false, conflict: latest ?? undefined };
    }
    throw e;
  }
}

// UI Component
export function useUpdateTripWithConflict() {
  return useMutation({
    mutationFn: async ({ tripId, updates, lastModified }: Params) => {
      const result = await updateTripWithConflictDetection(
        tripId,
        updates,
        lastModified
      );
      if (!result.success) {
        throw new ConflictError(result.conflict!);
      }
      return result;
    },
    onError: (error) => {
      if (error instanceof ConflictError) {
        // Mostrar dialog: "Outro usuário modificou. Deseja sobrescrever?"
        showConflictDialog(error.remoteTrip);
      }
    },
  });
}
```

---

## 9. FIRESTORE INDEXES

```yaml
# firestore.indexes.yaml (NEW)
indexes:
  - collectionGroup: trips
    queryScope: COLLECTION
    fields:
      - fieldPath: createdBy
        order: ASCENDING
      - fieldPath: createdAt
        order: DESCENDING

  - collectionGroup: trips
    queryScope: COLLECTION
    fields:
      - fieldPath: status
        order: ASCENDING
      - fieldPath: createdAt
        order: DESCENDING

  - collectionGroup: trips
    queryScope: COLLECTION
    fields:
      - fieldPath: isPublic
        order: ASCENDING
      - fieldPath: createdAt
        order: DESCENDING

# Para pesquisa (opcional, se usar Firestore search)
  - collectionGroup: trips
    queryScope: COLLECTION
    fields:
      - fieldPath: searchKeywords
        arrayConfig: CONTAINS
      - fieldPath: createdAt
        order: DESCENDING
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## 10. RESUMO DAS MUDANÇAS

| Aspecto | v1 | v2 |
|---------|----|----|
| **State Management** | Custom useState | React Query |
| **Firestore** | getDocs (polling) | onSnapshot (realtime) |
| **Validação** | Client-side apenas | Zod + Cloud Functions |
| **Cache** | Nenhum | 5min TTL + GC |
| **Paginação** | Nenhuma | Infinite scroll + virtual |
| **Sincronização** | Nenhuma | Listeners + Transactions |
| **Offline** | Não | IndexedDB cache |
| **Retry** | Manual | Automático com backoff |
| **Conflict Res.** | Sobrescreve | Detecta e dialoga |
| **Upload** | Síncrono | Paralelo com progresso |
| **TripFormWizard** | 800+ linhas | 200 linhas + 7 steps |
| **Complexidade** | ⚠️ Alta | ✅ Baixa |

---

## 🎯 CRONOGRAMA DE IMPLEMENTAÇÃO

**Fase 1: Fundação (Semana 1)**
- [ ] Instalar Zod, React Query, Dexie
- [ ] Criar schemas de validação
- [ ] Migrar hooks para useQuery

**Fase 2: Sincronização (Semana 2)**
- [ ] Implementar listeners Firestore
- [ ] Adicionar transações
- [ ] Cleanup automático

**Fase 3: Performance (Semana 3)**
- [ ] Paginação com infinite scroll
- [ ] Virtual scroll
- [ ] Firestore indexes

**Fase 4: Offline & Robustez (Semana 4)**
- [ ] IndexedDB cache
- [ ] Retry logic
- [ ] Conflict resolution
- [ ] Cloud Functions para validação

**Fase 5: Refactor UI (Semana 5)**
- [ ] Decompose TripFormWizard
- [ ] Simplificar AttractionsManager
- [ ] Testes e polish

---

**v2 = Production-Ready, Escalável para 100k+ usuários**
