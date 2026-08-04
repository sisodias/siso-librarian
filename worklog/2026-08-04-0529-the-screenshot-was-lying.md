# Worklog: the screenshot was lying, and the page had a real bug anyway

Date: 2026-08-04T05:29:52Z (generated filename)
Thread: Observatory — mobile layout

## What I set out to check

I ended last loop saying I could not claim the page worked on a phone because I had only read its HTML. Chrome is installed, so I rendered it headless at 390px and looked.

## The real defect it found

Text cut off mid-word across the whole page: `SOURCE INVENT…`, `41,501,3…`, `observed… 143 req`. The cause was real — `grid-template-columns:repeat(auto-fit,minmax(180px,1fr))` forces **two** columns into 390px minus padding and gap, giving ~173px per card, and the 26px values did not fit.

Fixed with a single-column breakpoint below 520px, plus `overflow-wrap:anywhere` on values and the `<pre>` block, which contained unbroken JSON lines up to 2,417 characters. After that, every card renders its full value: `SOURCE INVENTORIES 6`, `41,501,325`, `observed · 143 req`.

That was a genuine bug on the device Shaan said he would use, and it existed for the entire session.

## Where I then wasted four attempts

After the fix, screenshots **still** showed clipping at the right edge. I patched the same class of thing three more times — `overflow-x:hidden`, fluid `h1`, `max-width:100%` — each time re-shooting and seeing the same clip.

So I built a control: a page that *cannot* overflow, with a yellow bar carrying a 20px black right border. The border was **not in the screenshot**. Then I re-rendered the observatory at 430px and it clipped at the same relative position despite unchanged CSS.

**Headless Chrome's `--screenshot` crops roughly 20–35px off the right edge.** The clipping I was chasing after the first fix was the tool, not the page.

## What I should have done sooner

Built the control first. I had already learned tonight that the fix for a stubborn symptom is usually to test the instrument, and I still spent four rounds adjusting CSS against a measurement I had not validated.

The tell was there from the second screenshot: the clip stayed at a **fixed pixel offset** while I changed layout rules that should have moved it. A defect that does not respond to its supposed cause is evidence about the observer.

## Net result

- One real mobile layout bug found and fixed, verified by the values now being fully visible
- Three subsequent "fixes" applied against a phantom — all harmless (wrapping and hidden overflow are correct defensive CSS) but not the improvements I thought
- One measurement instrument now known to be unreliable at the right edge

## Residual

I still have not seen this on an actual phone. What I can now say precisely: at 390px CSS width the grid collapses to one column and every card's value renders in full. Whether it *looks* right on real hardware remains unverified, and the screenshot tool cannot answer it.
