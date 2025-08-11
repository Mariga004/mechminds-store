import getCategory from "@/actions/get-category";
import getProducts from "@/actions/get-products";
import Billboard from "@/app/components/billboard";
import Container from "@/app/components/ui/container"; 
import NoResults from "@/app/components/ui/no-results"; 
import ProductCard from "@/app/components/ui/product-card";

export const revalidate = 0;

interface CategoryPageProps {
    params: Promise<{
        categoryId: string;
    }>;

}

const CategoryPage = async ({ params }: CategoryPageProps) => {
    // Resolve the promises for params and searchParams
    const resolvedParams = await params;

    const { categoryId } = resolvedParams;

    if (!categoryId) return <div>Category not found</div>;

    const products = await getProducts({
        categoryId,
    });

    const category = await getCategory(categoryId);

    return (
        <div className="bg-white">
            <Container>
                {category?.billboard ? (
                    <Billboard data={category.billboard} />
                ) : (
                    <p className="text-center text-gray-500">No billboard available</p>
                )}
                <div className="px-4 sm:px-6 lg:px-8 pb-24">
                    <div className="lg:grid lg:grid-cols-5 lg:gap-x-8">
                        <div className="mt-6 lg:col-span-4 lg:mt-0">
                            {products.length === 0 ? <NoResults /> : (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {products.map((item) => (
                                        <ProductCard key={item.id} data={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default CategoryPage;