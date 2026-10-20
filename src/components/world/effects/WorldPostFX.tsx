import {
	EffectComposer,
	HueSaturation,
	Noise,
	ToneMapping,
	Vignette,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/**
 * Soft stylized finish. ColorDepth was crushing shaded facades to pure black.
 */
export function WorldPostFX({ preview = false }: { preview?: boolean }) {
	return (
		<EffectComposer multisampling={0} enableNormalPass={false}>
			<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
			<HueSaturation saturation={preview ? -0.06 : -0.1} />
			<Noise opacity={preview ? 0.025 : 0.035} premultiply />
			<Vignette offset={0.32} darkness={preview ? 0.2 : 0.28} />
		</EffectComposer>
	);
}
