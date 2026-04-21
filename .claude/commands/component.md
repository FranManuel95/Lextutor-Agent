Crea un nuevo componente React para este proyecto. Nombre del componente: $ARGUMENTS

Sigue exactamente estos pasos:

1. **Analiza el contexto**: Lee `src/components/ui/button.tsx` para entender el patrón de componentes del proyecto (Shadcn/UI + CVA + cn utility).

2. **Crea el componente** en `src/components/$ARGUMENTS.tsx`:
   - Usa primitivos de Shadcn/UI si aplica (import desde `@/components/ui/`)
   - TypeScript strict — define Props interface con todos los tipos explícitos
   - `cva` + `cn` para variantes si el componente tiene estados visuales
   - Tailwind para todo el estilo — sin CSS inline ni módulos CSS
   - `React.forwardRef` si el componente wrappea un elemento DOM
   - ARIA labels y roles semánticos para accesibilidad
   - Exporta el componente y sus tipos

3. **Crea el test** en `src/test/components/$ARGUMENTS.test.tsx`:
   - Usa `@testing-library/react` + `vitest`
   - Testa: render básico, variantes principales, interacciones, accesibilidad (rol, label)
   - Mock de dependencias externas si es necesario
   - Mínimo 4 test cases

4. **Crea la Storybook story** en `src/components/$ARGUMENTS.stories.tsx`:
   - Meta con `title: "Components/$ARGUMENTS"`, `tags: ["autodocs"]`
   - Story `Default` con args básicos
   - Story por cada variante visual relevante
   - Story `AllVariants` mostrando todas las variantes juntas

5. **Ejecuta los tests** con `npx vitest run src/test/components/$ARGUMENTS.test.tsx` y asegúrate de que pasan todos.

**Restricciones**: No uses `any`. No crees CSS modules. No instales nuevas dependencias sin preguntar. Shadcn/UI para componentes UI complejos.
