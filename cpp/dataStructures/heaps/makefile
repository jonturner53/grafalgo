IDIR = ../../include
LDIR = ../../lib
LIB = ${LDIR}/lib-ds.a
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 -Wall -I ${IDIR}

OFILES = Dheap.o Lheaps.o Llheaps.o FheapSet.o 

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

Dheap.o : ${IDIR}/stdinc.h ${IDIR}/Dheap.h
DheapSet.o : ${IDIR}/stdinc.h ${IDIR}/DheapSet.h
Lheaps.o : ${IDIR}/stdinc.h ${IDIR}/Lheaps.h
Llheaps.o : ${IDIR}/stdinc.h ${IDIR}/Llheaps.h
FheapSet.o : ${IDIR}/stdinc.h ${IDIR}/FheapSet.h

all :	${OFILES}
	ar -ru ${LIB} ${OFILES}

clean:
	rm -f *.o
	#make -C dvr clean
