"""Creates the test photos used by e2e.py from any sample orange photo: python3 make_images.py sample.jpg"""
import random, sys
from PIL import Image
src = Image.open(sys.argv[1]).convert('RGB')
for i, n in enumerate(['v_disease','v_gummosis','v_unable','v_halluc','v_notcitrus','v_429','v_500','v_garbage','v_cache','v_slow']):
    im = src.copy(); r = random.Random(i + 1)
    for _ in range(30): im.putpixel((r.randrange(im.width), r.randrange(im.height)), (r.randrange(256),) * 3)
    im.save(f'{n}.jpg', quality=92)
Image.new('RGB', (600, 600), (1, 1, 1)).save('black.jpg'); Image.new('RGB', (120, 120), (90, 140, 60)).save('tiny.jpg')
open('notes.txt', 'w').write('not an image'); Image.new('RGB', (400, 400)).save('anim.gif')
